import { PayrollCompletionBoundary } from '@/components/payroll/PayrollCompletionBoundary';
import { PayrollWorkspace } from '@/components/payroll/PayrollWorkspace';

export default function PayrollPage() {
  return (
    <>
      <PayrollCompletionBoundary />
      <PayrollWorkspace resource="overview" />
    </>
  );
}
