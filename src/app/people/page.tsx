import { HrModulePage } from '@/components/hr/HrModulePage';
import { getHrModuleConfig } from '@/lib/hr/hr-module-config';

export default function PeoplePage() {
  return <HrModulePage config={getHrModuleConfig('people')} />;
}
