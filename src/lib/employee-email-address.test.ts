import { describe, expect, it } from 'vitest';

import {
  buildEmployeeEmailCandidate,
  buildEmployeeEmailLocalPart,
  normalizeEmployeeEmailDomain,
  sanitizeEmployeeEmailDomainInput,
} from './employee-email-address';

describe('employee email addresses', () => {
  it('normalizes a configured company domain', () => {
    expect(sanitizeEmployeeEmailDomainInput(' https://@People.Example.COM/path ')).toBe('people.example.com');
    expect(normalizeEmployeeEmailDomain('People.Example.COM')).toBe('people.example.com');
  });

  it('rejects values that are not company domains', () => {
    expect(normalizeEmployeeEmailDomain('localhost')).toBeNull();
    expect(normalizeEmployeeEmailDomain('not a domain')).toBeNull();
    expect(normalizeEmployeeEmailDomain('')).toBeNull();
  });

  it('uses first name and the first three characters of last name', () => {
    expect(buildEmployeeEmailLocalPart('Jaroonwit', 'Poolnai', 'EMP-000001')).toBe('jaroonwit.poo');
    expect(buildEmployeeEmailCandidate('jaroonwit.poo', 'company.com')).toBe('jaroonwit.poo@company.com');
  });

  it('adds a deterministic suffix for duplicate addresses', () => {
    expect(buildEmployeeEmailCandidate('jaroonwit.poo', 'company.com', 2)).toBe('jaroonwit.poo2@company.com');
  });

  it('falls back to the employee number when a name cannot form an ASCII address', () => {
    expect(buildEmployeeEmailLocalPart('จารุณวิทย์', 'พูลใน', 'EMP-000123')).toBe('employee.000123');
  });
});
