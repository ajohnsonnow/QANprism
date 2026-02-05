/**
 * Decoy Calculator (Panic Mode)
 */

import React, { useState } from 'react';
import './DecoyCalculator.css';

interface DecoyCalculatorProps {
  onExit: () => void;
}

export const DecoyCalculator: React.FC<DecoyCalculatorProps> = ({ onExit }) => {
  const [display, setDisplay] = useState('0');

  const handlePress = (value: string) => {
    if (value === 'C') {
      setDisplay('0');
    } else if (value === '=') {
      // Secret exit: type "1969" and press =
      if (display === '1969') {
        onExit();
        return;
      }
      
      try {
        const result = eval(display.replace('×', '*').replace('÷', '/'));
        setDisplay(String(result));
      } catch {
        setDisplay('Error');
      }
    } else {
      setDisplay(prev => (prev === '0' ? value : prev + value));
    }
  };

  const buttons = [
    ['C', '÷', '×', '←'],
    ['7', '8', '9', '-'],
    ['4', '5', '6', '+'],
    ['1', '2', '3', '='],
    ['0', '.', '', ''],
  ];

  return (
    <div className="calculator">
      <div className="calculator-display">{display}</div>
      <div className="calculator-buttons">
        {buttons.map((row, rowIndex) => (
          <div key={rowIndex} className="calculator-row">
            {row.map((btn, btnIndex) => (
              btn ? (
                <button
                  key={btnIndex}
                  className={`calculator-button ${btn === '=' ? 'calculator-button-equals' : ''}`}
                  onClick={() => handlePress(btn)}
                >
                  {btn}
                </button>
              ) : <div key={btnIndex} className="calculator-button-empty" />
            ))}
          </div>
        ))}
      </div>
      <div className="calculator-hint">
        💡 Tip: Enter 1969 and press = to exit
      </div>
    </div>
  );
};
