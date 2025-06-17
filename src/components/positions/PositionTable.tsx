import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import React from 'react';

const Row = React.memo(({ index, style, data }: ListChildComponentProps) => {
  const position = data.positions[index];
  // ... copy the rendering logic for a single position row here ...
  return (
    <TableRow key={position.id} style={style} className="hover:bg-muted/50 transition-colors">
      {/* ... all TableCell components for position ... */}
    </TableRow>
  );
});

export function PositionTable({ positions, ...props }) {
  // ... existing code ...
  return (
    <TableBody>
      <List
        height={600}
        itemCount={positions.length}
        itemSize={48}
        width={"100%"}
        itemData={{ positions }}
      >
        {Row}
      </List>
    </TableBody>
  );
} 