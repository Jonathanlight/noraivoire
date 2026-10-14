import * as React from 'react';
import { render, screen } from '@testing-library/react-native';
import { NoraBtn } from '../../packages/core/dist/react-native/noraivoire';

test('rendu minimal', async () => {
  await render(<NoraBtn onPress={() => {}}>Valider</NoraBtn>);
  expect(screen.getByRole('button', { name: 'Valider' })).toBeTruthy();
});
