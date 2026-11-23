import { useEffect, useState } from 'react'

export function DeviceStorage({ locale }: { locale: string }) {
  const t = (en: string, zh: string) => locale === 'en' ? en : zh
  const [estimate, setEstimate] = useState<StorageEstimate>()
  const [persistent, setPersistent] = useState(false)
  const [attempted, setAttempted] = useState(false)
  useEffect(() => {
    let current = true
    const storage = navigator.storage
    if (storage?.estimate) void storage.estimate().then(result => {if(current) setEstimate(result)}).catch(() => {})
    if (storage?.persisted) void storage.persisted().then(result => {if(current) setPersistent(result)}).catch(() => {})
    return () => {current = false}
  }, [])
  const number = new Intl.NumberFormat(locale,{maximumFractionDigits: 1})
  return <details><summary>{t('Device storage','设备存储')}</summary>
    {estimate?.usage !== undefined && estimate.quota !== undefined && <p>{t('Used','已用')} {number.format(estimate.usage / 1048576)} MiB / {number.format(estimate.quota / 1048576)} MiB</p>}
    <p>{persistent ? t('Persistent storage is enabled.','已启用持久存储。') :
      t('Back up projects to recover them after browser data is cleared.','请备份项目，以便在浏览器数据清除后恢复。')}</p>
    {!persistent && navigator.storage?.persist && <button type="button" onClick={async () => {
      try {setPersistent(await navigator.storage.persist())} catch {setPersistent(false)} finally {setAttempted(true)}
    }}>{t('Request persistent storage','请求持久存储')}</button>}
    {attempted && !persistent && <p role="status">{t('The browser did not grant persistent storage. Keep a backup of your projects.','浏览器未授予持久存储，请保留项目备份。')}</p>}
  </details>
}
