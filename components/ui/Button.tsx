'use client';

import React from 'react';
import Icon, { IconName } from './Icon';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  loading?: boolean;
  icon?: IconName;
  iconOnly?: boolean;
}

export default function Button({
  variant = 'secondary',
  size = 'md',
  block,
  loading,
  icon,
  iconOnly,
  className = '',
  children,
  disabled,
  ...rest
}: Props) {
  const classes = [
    'btn',
    `btn-${variant}`,
    size !== 'md' ? `btn-${size}` : '',
    block ? 'btn-block' : '',
    iconOnly ? 'btn-icon' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : icon ? <Icon name={icon} size={iconOnly ? 20 : 17} /> : null}
      {!iconOnly && children}
    </button>
  );
}
