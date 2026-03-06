export function useEmployeeMode(): boolean {
  return localStorage.getItem('employeeMode') !== 'false'
}
