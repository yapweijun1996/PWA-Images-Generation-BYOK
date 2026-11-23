# Physical-device acceptance record

Status: awaiting physical devices. A desktop viewport test cannot exercise the iOS Home Screen, mobile screen reader, hardware keyboard transitions or Android installation. Use an isolated test project on each device. Scroll to the footer on Home or Create to record the displayed build ID. Record the OS/browser version, device model, date, observations and any failed steps. Exclude API keys, private images and unrelated screen content from evidence.

1. Open [the live app](https://yapweijun1996.github.io/PWA-Images-Generation-BYOK/) in Safari on iPhone and iPad and in Chrome on Android. Open Help. Follow the platform installation instructions and launch from the Home Screen. Confirm standalone display, correct icon and correct app subpath.
2. From Home, continue creating. Open the studio selector and model inspector. Enter a draft with the software keyboard, rotate the device and close the keyboard. Check that focus, text and actions remain visible in both orientations and clear the notch or home indicator.
3. With a temporary key, generate one small image, download it, back up the project and reopen it. Turn on airplane mode, close the app and launch it again. Verify the image and draft remain visible. An attempted generation should retain inputs and explain the network requirement.
4. Exercise the same navigation with VoiceOver on iPhone or TalkBack on Android. Check names, order, dialog traps, close-button focus restoration, job feedback and update announcements. Enable reduced motion and verify controls remain usable.
5. Verify system chrome in both light and dark themes and take measurements of the touch targets used in the generation journey. Test the installed client again during a real build update. Record the build before and after the explicit Update action.
6. On iPad, repeat the draft and inspector checks with an external keyboard if available. Record usable focus order and draft preservation through portrait and landscape. Mark external keyboard coverage as untested when no keyboard is available.
7. Return the device to its original settings, forget the test key and remove test-only browser data as appropriate.

Record results in the [release matrix](release-gates.md) against INS, SW, OFF, MOB and A11Y checks. Record field Core Web Vitals separately only when representative field measurements exist.
