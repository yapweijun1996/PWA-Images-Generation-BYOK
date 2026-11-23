"""Exercise a production build in the runner's existing Firefox installation."""
import json
import os
import shutil
import socket
import tempfile
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from uuid import uuid4

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


class ShellHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def verify_worker_build(browser, expected):
    assert browser.execute_script("return !!navigator.serviceWorker.controller")
    descriptor = browser.execute_async_script("""
        const done = arguments[arguments.length - 1];
        fetch('./build-info.json')
          .then(response => response.ok ? response.json() : null)
          .then(done, () => done(null));
    """)
    assert descriptor == expected, "Controlled browser returned an unexpected build descriptor"


def verify(directory):
    dist = Path("dist")
    expected = json.loads((dist / "build-info.json").read_text(encoding="utf-8"))
    expected_build = expected["buildId"]
    base = "PWA-Images-Generation-BYOK"
    shutil.copytree(dist, Path(directory) / base)
    options = webdriver.FirefoxOptions()
    options.binary_location = os.environ["FIREFOX_BINARY"]
    options.add_argument("-headless")
    options.set_preference("intl.accept_languages", "en-US,en")
    service = Service(executable_path=os.environ["GECKODRIVER"])
    with webdriver.Firefox(service=service, options=options) as browser:
        print("Firefox", browser.capabilities["browserVersion"], flush=True)
        browser.set_window_size(1440, 900)
        browser.set_page_load_timeout(45)
        wait = WebDriverWait(browser, 30)
        draft = "Firefox draft " + uuid4().hex
        with ThreadingHTTPServer(("127.0.0.1", 0), partial(ShellHandler, directory=directory)) as server:
            host, port = server.server_address
            url = f"http://{host}:{port}/{base}/"
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            try:
                browser.get(url)
                assert browser.execute_script("return matchMedia('(display-mode: browser)').matches")
                prompt = wait.until(lambda d: next((el for el in d.find_elements(
                    By.CSS_SELECTOR, ".creation-prompt textarea") if el.is_enabled()), False))
                wait.until(lambda d: expected_build in d.find_element(By.TAG_NAME, "footer").text)
                prompt.send_keys(draft)
                wait.until(lambda d: d.execute_async_script("""
                    const done = arguments[arguments.length - 1];
                    const open = indexedDB.open('pwa-images-generation-byok');
                    open.onerror = () => done(null);
                    open.onsuccess = () => {
                      const db = open.result;
                      const request = db.transaction('projects').objectStore('projects').get('first-project');
                      request.onsuccess = () => { db.close(); done(request.result?.draft?.prompt); };
                      request.onerror = () => { db.close(); done(null); };
                    };
                """) == draft)
                browser.set_script_timeout(45)
                assert browser.execute_async_script("""
                    const done = arguments[arguments.length - 1];
                    navigator.serviceWorker.ready.then(() => done(true), () => done(false));
                """)
                # The first page predates registration and acquires control on navigation.
                browser.get("about:blank")
                browser.get(url)
                wait.until(lambda d: d.execute_script("return !!navigator.serviceWorker.controller"))
                wait.until(lambda d: d.find_element(By.CSS_SELECTOR, ".creation-prompt textarea").get_property("value") == draft)
                verify_worker_build(browser, expected)
                print("Online browser mode, build and persisted IndexedDB draft verified", flush=True)
            finally:
                server.shutdown()
                thread.join()
        with socket.socket() as probe:
            probe.settimeout(2)
            assert probe.connect_ex((host, port)) != 0, "Origin still accepts connections"
        old_document = browser.find_element(By.TAG_NAME, "html")
        browser.execute_script("setTimeout(() => location.reload(), 0)")
        wait.until(EC.staleness_of(old_document))
        wait.until(lambda d: expected_build in d.find_element(By.TAG_NAME, "footer").text)
        wait.until(lambda d: d.find_element(By.CSS_SELECTOR, ".creation-prompt textarea").get_property("value") == draft)
        verify_worker_build(browser, expected)
        print("Origin stopped. Reload recovered build and draft:", json.dumps(expected), flush=True)


if __name__ == "__main__":
    with tempfile.TemporaryDirectory() as temporary:
        verify(temporary)
