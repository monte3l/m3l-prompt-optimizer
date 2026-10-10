import type { Register } from 'claude-code'

import { newContext, refine } from './handle.js'

export const register: Register = (on, options) => {
  const ctx = newContext(options)

  on('prompt.submit', async ($, e, next) => {
    const text = await refine(
      ctx,
      {
        fetch: async (url, init) => {
          const res = await $.http.fetch(url, init)
          return { status: res.status, headers: res.headers, text: res.text }
        },
        sleep: ms => $.clock.sleep(ms),
        timeout: (ms, signal) => $.clock.sleep(ms, { signal }).catch(() => new Promise<void>(() => {})),
        now: () => $.clock.now(),
      },
      {
        log: line => $.ui.log(line, { to: 'debug' }),
        toast: line => $.ui.toast(line),
      },
      e,
    )

    return next(text === e.text ? e : { ...e, text })
  }).catch(($, e, next) => next(e))
}
