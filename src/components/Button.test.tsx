import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from './Button';

describe('Button', () => {
  it('renders the label', () => {
    render(<Button label="Nova transação" onPress={() => {}} />);

    expect(screen.getByText('Nova transação')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    render(<Button label="Salvar" onPress={onPress} />);

    fireEvent.press(screen.getByText('Salvar'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    render(<Button label="Salvar" onPress={onPress} disabled />);

    fireEvent.press(screen.getByText('Salvar'));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows a loading indicator instead of the label when loading', () => {
    render(<Button label="Salvar" onPress={() => {}} loading />);

    expect(screen.queryByText('Salvar')).toBeNull();
  });
});
