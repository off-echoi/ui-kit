import * as React from "react";
import { InfoBoxProps } from "../../infobox/components/InfoBox";
import { InfoBoxInline } from "../../infobox";
import { SpacingBox } from "../../styleUtils/modifiers";

type FormMessageProps = Omit<InfoBoxProps, "message">;

const FormMessage = ({ children, className, ...other }: FormMessageProps) => (
  <SpacingBox
    className={className}
    side="bottom"
    spacingSize="l"
    data-cy="formMessage"
  >
    <InfoBoxInline message={children} {...other} />
  </SpacingBox>
);

export default FormMessage;
