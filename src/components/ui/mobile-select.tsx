"use client"

import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { useDynamicZIndex } from "@/contexts/ZIndexContext"
import { MobileSelectDialog } from "@/components/ui/mobile-select-dialog"
import { extractMobileSelectItems } from "@/components/ui/mobile-select-utils"
import {
  Select,
  SelectContent as BaseSelectContent,
  SelectItem as BaseSelectItem,
  SelectTrigger as BaseSelectTrigger,
  SelectValue as BaseSelectValue,
  SelectGroup as BaseSelectGroup
} from "@/components/ui/select"

interface MobileSelectItem {
  value: string
  label: React.ReactNode
  disabled?: boolean
}

type SelectProps = React.ComponentProps<typeof Select>

interface MobileSelectProps extends Omit<SelectProps, 'children'> {
  children: React.ReactNode
  placeholder?: string
  selectId?: string
}

export function MobileSelect({ children, placeholder, selectId, ...selectProps }: MobileSelectProps) {
  const isMobile = useIsMobile()
  const { contentZIndex } = useDynamicZIndex(selectId || 'mobile-select', 'modal')

  const items = React.useMemo(() => {
    return extractMobileSelectItems(children)
  }, [children])

  const selectedItem = React.useMemo(() => {
    if (!selectProps.value) return undefined
    return items.find(item => item.value === selectProps.value)
  }, [items, selectProps.value])

  if (isMobile) {
    return (
      <MobileSelectDialog
        contentZIndex={contentZIndex}
        disabled={selectProps.disabled}
        items={items}
        onValueChange={selectProps.onValueChange}
        placeholder={placeholder}
        selectId={selectId}
        selectedItem={selectedItem}
        value={selectProps.value}
      />
    )
  }

  return (
    <Select {...selectProps}>
      {children}
    </Select>
  )
}

// Re-export Select components for convenience
export {
  BaseSelectContent as SelectContent,
  BaseSelectItem as SelectItem,
  BaseSelectTrigger as SelectTrigger,
  BaseSelectValue as SelectValue,
  BaseSelectGroup as SelectGroup
}

