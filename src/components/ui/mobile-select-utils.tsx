import * as React from "react";

export interface MobileSelectItem {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

type SelectItemElementProps = {
  value?: string;
  children?: React.ReactNode;
  disabled?: boolean;
};

function getElementDisplayName(element: React.ReactElement): string | undefined {
  const elementType = element.type;

  if (typeof elementType === "string") {
    return undefined;
  }

  return "displayName" in elementType && typeof elementType.displayName === "string"
    ? elementType.displayName
    : undefined;
}

function isSelectItemElement(element: React.ReactElement): element is React.ReactElement<SelectItemElementProps> {
  return getElementDisplayName(element) === "SelectItem";
}

function isSelectGroupElement(element: React.ReactElement): element is React.ReactElement<{ children?: React.ReactNode }> {
  return getElementDisplayName(element) === "SelectGroup";
}

function appendSelectItem(items: MobileSelectItem[], child: React.ReactElement<SelectItemElementProps>) {
  items.push({
    value: child.props.value || "",
    label: child.props.children,
    disabled: child.props.disabled,
  });
}

export function extractMobileSelectItems(children: React.ReactNode) {
  const extractedItems: MobileSelectItem[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) {
      return;
    }

    if (isSelectItemElement(child)) {
      appendSelectItem(extractedItems, child);
      return;
    }

    if (isSelectGroupElement(child)) {
      React.Children.forEach(child.props.children, (groupChild) => {
        if (React.isValidElement(groupChild) && isSelectItemElement(groupChild)) {
          appendSelectItem(extractedItems, groupChild);
        }
      });
    }
  });

  return extractedItems;
}
