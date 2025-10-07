interface UpdateVersionEventData {
  ver: string
}
type UpdateVersionEventCallback = (data: UpdateVersionEventData) => void

interface CallbackWithListener extends UpdateVersionEventCallback {
  _listener?: EventListener
}

export const updateVersionEvent = {
  eventName: "update-version-params",

  add(callback: CallbackWithListener): void {
    const listener = ((e: Event) => {
      callback((e as CustomEvent<UpdateVersionEventData>).detail)
    }) as EventListener

    callback._listener = listener
    window.addEventListener(this.eventName, listener)
  },

  remove(callback: CallbackWithListener): void {
    const listener = callback._listener
    if (listener) {
      window.removeEventListener(this.eventName, listener)
    }
  },

  dispatch(data: UpdateVersionEventData): void {
    window.dispatchEvent(new CustomEvent(this.eventName, { detail: data }))
  },
}
