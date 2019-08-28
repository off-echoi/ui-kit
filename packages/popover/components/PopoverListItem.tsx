import * as React from "react";
import { cx, css } from "emotion";
import { menuListItem, menuListItemActive } from "../style";
import {
  padding,
  margin,
  display,
  tintContent
} from "../../shared/styles/styleUtils";
import {
  themeBgSelected,
  themeTextColorPrimary,
  themeTextColorPrimaryInverted,
  themeError
} from "../../design-tokens/build/js/designTokens";
import getCSSVarValue from "../../utilities/components/getCSSVarValue";
import { darken, pickReadableTextColor } from "../../shared/styles/color";
import { PopoverListItemAppearances } from "../../shared/types/popoverListItemAppearances";
import PopoverListItemIcon from "./PopoverListItemIcon";
import PopoverListItemAvatar from "./PopoverListItemAvatar";
import { Flex, FlexItem } from "../../styleUtils/layout";

export interface PopoverListItemProps extends React.HTMLProps<HTMLDivElement> {
  appearance?: PopoverListItemAppearances;
  children: React.ReactNode;
  disabled?: boolean;
  index: number;
  listLength: number;
  isActive?: boolean;
  isSelected?: boolean;
}

const PopoverListItem = (props: PopoverListItemProps) => {
  const {
    appearance,
    isActive,
    isSelected,
    index,
    listLength,
    disabled,
    children,
    ...other
  } = props;
  // Importing these was causing issues with `getCSSVarValue` where it would
  // always return the fallback color, even though the CSS var had been set
  // on the :root
  const menuListItemSelected = css`
    background-color: ${themeBgSelected};
    color: ${pickReadableTextColor(
      getCSSVarValue(themeBgSelected),
      getCSSVarValue(themeTextColorPrimary),
      getCSSVarValue(themeTextColorPrimaryInverted)
    )};
  `;
  const menuListItemSelectedActive = css`
    background-color: ${darken(getCSSVarValue(themeBgSelected), 1)};
  `;

  const {
    itemGraphicStart,
    itemGraphicEnd,
    itemContent
  } = (React.Children.toArray(children) as Array<
    React.ReactElement<any>
  >).reduce<{
    itemGraphicStart: React.ReactNode;
    itemGraphicEnd: React.ReactNode;
    itemContent: React.ReactNode;
  }>(
    (_, item) => {
      const itemChildren =
        item.props &&
        (React.Children.toArray(item.props.children) as Array<
          React.ReactElement<any>
        >);
      if (!itemChildren) {
        return {
          itemGraphicStart: <React.Fragment />,
          itemGraphicEnd: <React.Fragment />,
          itemContent: children
        };
      }
      const isItemGraphic = child =>
        child.type === PopoverListItemIcon ||
        child.type === PopoverListItemAvatar;
      const itemGraphicStart = itemChildren.find(
        child =>
          React.isValidElement<PopoverListItemIcon | PopoverListItemAvatar>(
            child
          ) &&
          isItemGraphic(child) &&
          child.props.position === "start"
      );
      const itemGraphicEnd = itemChildren.find(
        child =>
          React.isValidElement<PopoverListItemIcon | PopoverListItemAvatar>(
            child
          ) &&
          isItemGraphic(child) &&
          child.props.position === "end"
      );
      const itemContent = itemChildren.filter(
        child =>
          !(
            React.isValidElement<PopoverListItemIcon | PopoverListItemAvatar>(
              child
            ) && isItemGraphic(child)
          )
      );

      return {
        itemGraphicStart,
        itemGraphicEnd,
        itemContent
      };
    },
    {
      itemGraphicStart: <React.Fragment />,
      itemGraphicEnd: <React.Fragment />,
      itemContent: <React.Fragment />
    }
  );

  return (
    <div
      className={cx(
        menuListItem,
        padding("horiz"),
        padding("vert", "xs"),
        // display: table; makes the menu items fill the space when it's
        // parent has explicit width set, while still allowing a long string
        // w/o spaces to overflow the menu and cause a horizontal scroll
        display("table"),
        {
          [menuListItemActive]: isActive,
          [menuListItemSelected]: isSelected,
          [menuListItemSelectedActive]: isActive && isSelected,
          [margin("top", "xs")]: index === 0,
          [margin("bottom", "xs")]: index === listLength - 1,
          [tintContent(themeError)]: appearance === "danger"
        }
      )}
      data-cy="PopoverListItem"
      {...other}
    >
      {itemGraphicStart || itemGraphicEnd ? (
        <Flex align="center" gutterSize="xs">
          {itemGraphicStart ? (
            <FlexItem flex="shrink">{itemGraphicStart}</FlexItem>
          ) : null}
          <FlexItem>{itemContent}</FlexItem>
          {itemGraphicEnd ? (
            <FlexItem flex="shrink">{itemGraphicEnd}</FlexItem>
          ) : null}
        </Flex>
      ) : (
        itemContent
      )}
    </div>
  );
};

export default PopoverListItem;
