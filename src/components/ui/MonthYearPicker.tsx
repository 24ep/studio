import React, { useState } from 'react';
import { format, setMonth, setYear } from 'date-fns';
import { Button } from './button';

interface MonthYearPickerProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const currentYear = new Date().getFullYear();
const yearRange = Array.from({ length: 50 }, (_, i) => currentYear - i);

export const MonthYearPicker: React.FC<MonthYearPickerProps> = ({ value, onChange, label, className }) => {
  // Parse value
  let startMonth = '';
  let startYear = '';
  let endMonth = '';
  let endYear = '';
  let isPresent = false;
  if (value) {
    const match = value.match(/([A-Za-z]+) (\d{4}) - (([A-Za-z]+) (\d{4})|Present)/);
    if (match) {
      startMonth = match[1];
      startYear = match[2];
      if (match[3] === 'Present') {
        isPresent = true;
      } else {
        endMonth = match[4];
        endYear = match[5];
      }
    }
  }
  const [startM, setStartM] = useState(startMonth || months[new Date().getMonth()]);
  const [startY, setStartY] = useState(startYear || String(currentYear));
  const [endM, setEndM] = useState(endMonth || months[new Date().getMonth()]);
  const [endY, setEndY] = useState(endYear || String(currentYear));
  const [present, setPresent] = useState(isPresent);

  const handleChange = (sm: string, sy: string, em: string, ey: string, pres: boolean) => {
    if (pres) {
      onChange(`${sm} ${sy} - Present`);
    } else {
      onChange(`${sm} ${sy} - ${em} ${ey}`);
    }
  };

  return (
    <div className={className}>
      {label && <label className="block mb-1 font-medium">{label}</label>}
      <div className="flex items-center gap-2 flex-wrap">
        <select value={startM} onChange={e => { setStartM(e.target.value); handleChange(e.target.value, startY, endM, endY, present); }} className="border rounded p-1">
          {months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={startY} onChange={e => { setStartY(e.target.value); handleChange(startM, e.target.value, endM, endY, present); }} className="border rounded p-1">
          {yearRange.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <span>-</span>
        {!present && (
          <>
            <select value={endM} onChange={e => { setEndM(e.target.value); handleChange(startM, startY, e.target.value, endY, present); }} className="border rounded p-1">
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={endY} onChange={e => { setEndY(e.target.value); handleChange(startM, startY, endM, e.target.value, present); }} className="border rounded p-1">
              {yearRange.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </>
        )}
        <label className="ml-2 flex items-center gap-1">
          <input type="checkbox" checked={present} onChange={e => { setPresent(e.target.checked); handleChange(startM, startY, endM, endY, e.target.checked); }} /> Present
        </label>
      </div>
    </div>
  );
}; 