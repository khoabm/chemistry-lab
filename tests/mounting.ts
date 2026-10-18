import { fireEvent, screen } from '@testing-library/react'

// Real native workflow for existing LabPage tests. Layout-less jsdom supplies
// only the bench measurement, never a fake mount or alternative heating rule.
export function mountSelectedSample(lampEquipmentId: string) {
  const bench = screen.getByRole('group', { name: 'Laboratory bench' })
  if (!bench.getBoundingClientRect().width) {
    bench.getBoundingClientRect = () => new DOMRect(300, 100, 600, 400)
  }
  fireEvent.click(screen.getByRole('tab', { name: 'Sample' }))
  fireEvent.change(screen.getByRole('combobox', { name: 'Alcohol lamp support' }), { target: { value: lampEquipmentId } })
  fireEvent.click(screen.getByRole('button', { name: 'Mount on support' }))
}
