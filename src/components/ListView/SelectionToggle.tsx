'use client'

import { Button, useSelection } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export const SelectionToggle: React.FC = () => {
  const { toggleAll, count } = useSelection()
  const [target, setTarget] = useState<HTMLElement | null>(null)

  useEffect(() => {
    let injectedContainer: HTMLElement | null = null

    const updateTarget = () => {
      // 0. Safety Check: If Payload adds a native "Deselect" button, abort.
      // We look for any button containing "Deselect" that isn't ours (we can distinguish by class or context,
      // but simple text check on other buttons is a decent heuristic).
      const distinctDeselect = Array.from(document.querySelectorAll('button')).some(
        (btn) =>
          btn.textContent?.toLowerCase().includes('deselect') &&
          !btn.closest('.media-gallery-injected-actions'),
      )

      if (distinctDeselect) {
        // If found, ensuring we cleanup our own if it exists
        if (injectedContainer && injectedContainer.parentNode) {
          injectedContainer.parentNode.removeChild(injectedContainer)
          injectedContainer = null
          setTarget(null)
        }
        return
      }

      // 1. Find the persistent Edit/Delete group
      const persistentGroup = document
        .querySelector(
          '.list-selection__actions .edit-many, .list-selection__actions .delete-documents__toggle',
        )
        ?.closest('.list-selection__actions') as HTMLElement

      if (!persistentGroup) {
        if (injectedContainer && injectedContainer.parentNode) {
          injectedContainer.parentNode.removeChild(injectedContainer)
          injectedContainer = null
          setTarget(null)
        }
        return
      }

      // 2. Look at the previous sibling (should be the separator <span>—</span>)
      const separator = persistentGroup.previousElementSibling as HTMLElement

      // If we already injected one, reuse it.
      if (injectedContainer && document.body.contains(injectedContainer)) {
        if (target !== injectedContainer) setTarget(injectedContainer)
        return
      }

      // 3. Create our container
      const newContainer = document.createElement('div')
      newContainer.className = 'list-selection__actions media-gallery-injected-actions'

      const refNode = separator || persistentGroup
      refNode.parentNode?.insertBefore(newContainer, refNode)

      injectedContainer = newContainer
      setTarget(newContainer)
    }

    // Initial check
    updateTarget()

    const observer = new MutationObserver(() => {
      updateTarget()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    })

    return () => {
      observer.disconnect()
      if (injectedContainer && injectedContainer.parentNode) {
        injectedContainer.parentNode.removeChild(injectedContainer)
      }
    }
  }, [])

  if (!target || count === 0) return null

  return createPortal(
    <React.Fragment>
      <span>—</span>
      <Button
        buttonStyle="none"
        className="list-selection__button btn--icon-style-without-border"
        onClick={() => toggleAll(false)}
        size="medium"
      >
        Deselect All ({count})
      </Button>
    </React.Fragment>,
    target,
  )
}
