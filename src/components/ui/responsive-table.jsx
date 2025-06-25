"use client";
import React from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
export function ResponsiveTable({ children, className, containerClassName, showScrollIndicator = true }) {
    return (<div className={cn('relative', containerClassName)}>
      <ScrollArea className="w-full">
        <div className={cn('min-w-full', className)}>
          {children}
        </div>
      </ScrollArea>
      {showScrollIndicator && (<div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-background/50 to-transparent pointer-events-none"/>)}
    </div>);
}
export function Table({ children, className }) {
    return (<table className={cn('w-full caption-bottom text-sm', 'border-collapse', className)}>
      {children}
    </table>);
}
export function TableHeader({ children, className }) {
    return (<thead className={cn('bg-muted/50', '[&_tr]:border-b', className)}>
      {children}
    </thead>);
}
export function TableBody({ children, className }) {
    return (<tbody className={cn('[&_tr:last-child]:border-0', className)}>
      {children}
    </tbody>);
}
export function TableRow({ children, className, onClick, hover = true }) {
    return (<tr className={cn('border-b transition-colors', hover && 'hover:bg-muted/50', onClick && 'cursor-pointer', className)} onClick={onClick}>
      {children}
    </tr>);
}
export function TableHead({ children, className, align = 'left' }) {
    return (<th className={cn('h-12 px-4 text-left align-middle font-medium text-muted-foreground', 'whitespace-nowrap', align === 'center' && 'text-center', align === 'right' && 'text-right', className)}>
      {children}
    </th>);
}
export function TableCell({ children, className, align = 'left', truncate = false }) {
    return (<td className={cn('p-4 align-middle', align === 'center' && 'text-center', align === 'right' && 'text-right', truncate && 'max-w-0 truncate', className)}>
      {children}
    </td>);
}
export function MobileTableRow({ title, value, className }) {
    return (<div className={cn('flex flex-col space-y-1 py-2 border-b last:border-b-0', 'sm:flex-row sm:items-center sm:justify-between sm:space-y-0', className)}>
      <dt className="text-sm font-medium text-muted-foreground">{title}</dt>
      <dd className="text-sm">{value}</dd>
    </div>);
}
export function CardTable({ data, columns, className, onRowClick }) {
    return (<div className={cn('space-y-4', className)}>
      {data.map((row) => (<div key={row.id} className={cn('border rounded-lg p-4 space-y-2', onRowClick && 'cursor-pointer hover:bg-muted/50 transition-colors')} onClick={() => onRowClick === null || onRowClick === void 0 ? void 0 : onRowClick(row)}>
          {columns.map((column) => (<MobileTableRow key={column.key} title={column.label} value={column.render ? column.render(row[column.key], row) : row[column.key]}/>))}
        </div>))}
    </div>);
}
export function AdaptiveTable({ data, columns, className, onRowClick, breakpoint = 'md' }) {
    return (<>
      {/* Desktop table view */}
      <div className={cn('hidden', breakpoint === 'sm' ? 'sm:block' : breakpoint === 'md' ? 'md:block' : 'lg:block')}>
        <ResponsiveTable>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (<TableHead key={column.key} align={column.align}>
                    {column.label}
                  </TableHead>))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (<TableRow key={row.id} onClick={() => onRowClick === null || onRowClick === void 0 ? void 0 : onRowClick(row)}>
                  {columns.map((column) => (<TableCell key={column.key} align={column.align}>
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </TableCell>))}
                </TableRow>))}
            </TableBody>
          </Table>
        </ResponsiveTable>
      </div>

      {/* Mobile card view */}
      <div className={cn('block', breakpoint === 'sm' ? 'sm:hidden' : breakpoint === 'md' ? 'md:hidden' : 'lg:hidden')}>
        <CardTable data={data} columns={columns} onRowClick={onRowClick}/>
      </div>
    </>);
}
