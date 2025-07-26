import React from 'react';

interface Props {
  buttonClassName?: string;
}

const CreditPurchaseMenu: React.FC<Props> = ({ buttonClassName }) => (
  <button className={buttonClassName} data-testid="credit-purchase-menu">
    Purchase Credits
  </button>
);

export default CreditPurchaseMenu;