// The application CSP forbids generated code, including capability probes.
import { z } from 'zod'
z.config({ jitless: true })
export { z }
