import React, { FunctionComponent, CSSProperties } from 'react';

import './index.sass';

interface SimpleIconButtonProps {
  active?: boolean;
  disabled?: boolean;
  type: string;
  className?: string;
  style?: CSSProperties;
  onClick?: (e: any) => void;
}

const SimpleIconButton: FunctionComponent<SimpleIconButtonProps> = props => {
  const imgSrc = require(`../../assets/images/${props.type}.png`);
  const Icon = <img src={imgSrc} alt={props.type} />;
  const className =
    (props.className || '') +
    ' icon-btn' +
    (props.active ? ' active' : '') +
    (props.disabled ? ' disabled' : '');

  const handleClick = (e: any) => {
    if (props.disabled) {
      return;
    }
    props.onClick && props.onClick(e);
  };

  return (
    <div style={props.style} onClick={handleClick} className={className}>
      {Icon}
    </div>
  );
};

export default SimpleIconButton;
