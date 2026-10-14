// NoraIvoire — rendu réel des composants React Native générés (accessibilité, styles, interactions).
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
import * as React from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import {
  NoraBadge,
  NoraBtn,
  NoraCard,
  NoraCheckbox,
  NoraField,
  NoraInput,
  NoraRadio,
  NoraRadioGroup,
  NoraSelect,
  NoraSwitch,
  NoraTextarea,
  configureNora,
  noraColors,
} from '../../packages/core/dist/react-native/noraivoire';
import parity from '../parity/rn.json';

type Entry = Record<string, unknown> & { ind?: Record<string, unknown> };
const P = parity as Record<string, Entry>;
const flat = (el: { props: { style?: unknown } }) => StyleSheet.flatten(el.props.style as never) as Record<string, unknown>;
const hex = (c: unknown) => String(c).toUpperCase();
const radius = (r: unknown) => (r === 'full' ? 9999 : r);

const TONES = ['primary', 'neutral', 'danger', 'success', 'warning'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;

describe('NoraBtn', () => {
  for (const scheme of ['light', 'dark'] as const) {
    for (const tone of TONES) {
      for (const size of SIZES) {
        test(`${scheme} ${tone} ${size} : styles conformes à rn.json`, async () => {
          configureNora({ scheme });
          await render(<NoraBtn tone={tone} size={size} onPress={() => {}}>Action</NoraBtn>);
          const btn = screen.getByRole('button', { name: 'Action' });
          const st = flat(btn);
          const ref = P[`${scheme}/btn/${tone}/${size}`];
          expect(hex(st.backgroundColor)).toBe(ref.bg);
          expect(st.paddingVertical).toBe(ref.padY);
          expect(st.paddingHorizontal).toBe(ref.padX);
          expect(st.borderRadius).toBe(radius(ref.radius));
          expect(st.minHeight).toBeGreaterThanOrEqual(44);
          expect(st.minWidth).toBeGreaterThanOrEqual(44);
          const label = flat(screen.getByText('Action'));
          expect(hex(label.color)).toBe(ref.fg);
          expect(label.fontSize).toBe(ref.font);
        });
      }
    }
  }

  test('appui : onPress et retour haptique injecté par configureNora()', async () => {
    const haptic = jest.fn();
    const onPress = jest.fn();
    configureNora({ haptic });
    await render(<NoraBtn onPress={onPress}>Payer</NoraBtn>);
    await fireEvent.press(screen.getByRole('button', { name: 'Payer' }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(haptic).toHaveBeenCalledWith('light');
  });

  test('haptic={false} : aucun retour haptique', async () => {
    const haptic = jest.fn();
    configureNora({ haptic });
    await render(<NoraBtn haptic={false} onPress={() => {}}>Payer</NoraBtn>);
    await fireEvent.press(screen.getByRole('button', { name: 'Payer' }));
    expect(haptic).not.toHaveBeenCalled();
  });

  test('désactivé : état annoncé, appui ignoré, opacité réduite', async () => {
    const onPress = jest.fn();
    await render(<NoraBtn disabled onPress={onPress}>Payer</NoraBtn>);
    const btn = screen.getByRole('button', { name: 'Payer' });
    expect(btn).toBeDisabled();
    await fireEvent.press(btn);
    expect(onPress).not.toHaveBeenCalled();
    expect(flat(btn).opacity).toBe(0.5);
  });
});

describe('NoraBadge et NoraCard', () => {
  for (const scheme of ['light', 'dark'] as const) {
    for (const tone of TONES) {
      for (const size of ['sm', 'md'] as const) {
        test(`badge ${scheme} ${tone} ${size}`, async () => {
          configureNora({ scheme });
          await render(<NoraBadge tone={tone} size={size} testID="badge">Nouveau</NoraBadge>);
          const text = screen.getByText('Nouveau');
          const ref = P[`${scheme}/badge/${tone}/${size}`];
          const box = flat(screen.getByTestId('badge'));
          expect(hex(box.backgroundColor)).toBe(ref.bg);
          expect(box.paddingVertical).toBe(ref.padY);
          expect(box.paddingHorizontal).toBe(ref.padX);
          expect(box.borderRadius).toBe(radius(ref.radius));
          expect(box.alignSelf).toBe('flex-start');
          expect(hex(flat(text).color)).toBe(ref.fg);
          expect(flat(text).fontSize).toBe(ref.font);
        });
      }
    }
    for (const size of SIZES) {
      test(`carte ${scheme} ${size}`, async () => {
        configureNora({ scheme });
        await render(<NoraCard size={size} testID="carte"><Text>Contenu</Text></NoraCard>);
        const st = flat(screen.getByTestId('carte'));
        const ref = P[`${scheme}/card/neutral/${size}`];
        expect(hex(st.backgroundColor)).toBe(ref.bg);
        expect(st.paddingVertical ?? st.padding).toBe(ref.padY);
        expect(st.paddingHorizontal ?? st.padding).toBe(ref.padX);
        expect(st.borderRadius).toBe(radius(ref.radius));
        expect(st.borderWidth).toBe(ref.borderWidth);
        expect(hex(st.borderColor)).toBe(ref.borderColor);
      });
    }
  }
});

describe('Formulaires', () => {
  test('NoraInput : styles conformes, libellé, aide et erreur de NoraField', async () => {
    const ref = P['light/input/neutral/md'];
    await render(
      <NoraField label="Téléphone" help="Le livreur vous appelle." error="Numéro trop court.">
        <NoraInput value="" onChangeText={() => {}} />
      </NoraField>,
    );
    const input = screen.getByLabelText('Téléphone');
    expect(input.props.accessibilityHint).toBe('Numéro trop court.');
    const st = flat(input);
    expect(hex(st.backgroundColor)).toBe(ref.bg);
    expect(st.borderRadius).toBe(ref.radius);
    expect(st.minHeight).toBeGreaterThanOrEqual(44);
    expect(st.fontSize).toBe(ref.font);
    // Erreur : bordure de la couleur « danger » et message annoncé en région live.
    expect(hex(st.borderColor)).toBe(noraColors.light.danger.toUpperCase());
    expect(screen.getByText('Numéro trop court.').props.accessibilityLiveRegion).toBe('polite');
    // Libellé et aide visibles ne sont pas lus deux fois.
    expect(screen.queryByText('Téléphone')).toBeNull();
    expect(screen.getByText('Téléphone', { includeHiddenElements: true }).props.accessibilityElementsHidden).toBe(true);
    expect(screen.getByText('Le livreur vous appelle.', { includeHiddenElements: true }).props.importantForAccessibility).toBe('no');
  });

  test('NoraInput sans erreur : aide en indice, bordure normale, focus visible', async () => {
    const ref = P['light/input/neutral/md'];
    await render(
      <NoraField label="Nom" help="Tel qu'il figure sur la pièce d'identité.">
        <NoraInput value="" onChangeText={() => {}} />
      </NoraField>,
    );
    const input = screen.getByLabelText('Nom');
    expect(input.props.accessibilityHint).toBe("Tel qu'il figure sur la pièce d'identité.");
    expect(hex(flat(input).borderColor)).toBe(ref.borderColor);
    await fireEvent(input, 'focus');
    const focused = flat(screen.getByLabelText('Nom'));
    expect(hex(focused.borderColor)).toBe(noraColors.light.focus.toUpperCase());
    expect(focused.borderWidth).toBeGreaterThan(1);
  });

  test('NoraField désactivé : contrôle non éditable et état annoncé', async () => {
    await render(
      <NoraField label="Référence" disabled>
        <NoraInput value="CMD-1" />
      </NoraField>,
    );
    const input = screen.getByLabelText('Référence');
    expect(input.props.editable).toBe(false);
    expect(input.props.accessibilityState).toEqual({ disabled: true });
  });

  test('NoraTextarea : multiligne, libellé via NoraField', async () => {
    await render(
      <NoraField label="Message">
        <NoraTextarea value="" onChangeText={() => {}} />
      </NoraField>,
    );
    expect(screen.getByLabelText('Message').props.multiline).toBe(true);
  });

  for (const tone of TONES) {
    test(`NoraCheckbox ${tone} : rôle, état, couleurs et bascule`, async () => {
      const ref = P[`light/checkbox/${tone}/md`];
      const Host = () => {
        const [v, setV] = React.useState(false);
        return <NoraCheckbox tone={tone} checked={v} onChange={setV}>J'accepte</NoraCheckbox>;
      };
      await render(<Host />);
      const box = screen.getByRole('checkbox', { name: "J'accepte" });
      expect(box).not.toBeChecked();
      expect(flat(box).minHeight).toBeGreaterThanOrEqual(44);
      const ind = () => flat(screen.getByRole('checkbox').children[0] as never);
      expect(hex(ind().backgroundColor)).toBe(ref.ind!.offBg);
      expect(ind().width).toBe(ref.ind!.w);
      expect(ind().borderRadius).toBe(ref.ind!.radius);
      await fireEvent.press(box);
      expect(screen.getByRole('checkbox', { name: "J'accepte" })).toBeChecked();
      expect(hex(ind().backgroundColor)).toBe(ref.ind!.onBg);
      // Coche visible mais décorative : jamais lue (le nom reste « J'accepte »).
      expect(screen.queryByText('✓')).toBeNull();
      expect(screen.getByText('✓', { includeHiddenElements: true })).toBeTruthy();
    });
  }

  test('NoraCheckbox sans onChange : désactivé (lecture seule)', async () => {
    await render(<NoraCheckbox checked>Option</NoraCheckbox>);
    expect(screen.getByRole('checkbox', { name: 'Option' })).toBeDisabled();
  });

  test('NoraCheckbox invalide via NoraField : bordure danger et erreur en indice', async () => {
    await render(
      <NoraField label="Conditions" error="Obligatoire.">
        <NoraCheckbox checked={false} onChange={() => {}}>J'accepte</NoraCheckbox>
      </NoraField>,
    );
    const box = screen.getByRole('checkbox');
    expect(box.props.accessibilityHint).toBe('Obligatoire.');
    expect(hex(flat(box.children[0] as never).borderColor)).toBe(noraColors.light.danger.toUpperCase());
  });

  test('NoraSwitch : rôle switch, bascule, dimensions de la piste', async () => {
    const ref = P['light/switch/primary/md'];
    const onChange = jest.fn();
    await render(<NoraSwitch checked={false} onChange={onChange}>Notifications</NoraSwitch>);
    const sw = screen.getByRole('switch', { name: 'Notifications' });
    expect(sw).not.toBeChecked();
    expect(flat(sw).minHeight).toBeGreaterThanOrEqual(44);
    const track = flat(sw.children[0] as never);
    expect(track.width).toBe(ref.ind!.w);
    expect(track.height).toBe(ref.ind!.h);
    expect(hex(track.backgroundColor)).toBe(ref.ind!.offBg);
    await fireEvent.press(sw);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  test('NoraRadioGroup / NoraRadio : groupe, sélection exclusive, états', async () => {
    const ref = P['light/radio/primary/md'];
    const Host = () => {
      const [v, setV] = React.useState<'matin' | 'soir'>('matin');
      return (
        <NoraField label="Créneau">
          <NoraRadioGroup value={v} onChange={setV}>
            <NoraRadio value="matin">Matin</NoraRadio>
            <NoraRadio value="soir">Soir</NoraRadio>
          </NoraRadioGroup>
        </NoraField>
      );
    };
    await render(<Host />);
    expect(screen.root!.queryAll((n) => n.props.accessibilityRole === 'radiogroup')).toHaveLength(1);
    const matin = () => screen.getByRole('radio', { name: 'Matin' });
    const soir = () => screen.getByRole('radio', { name: 'Soir' });
    expect(matin()).toBeChecked();
    expect(soir()).not.toBeChecked();
    expect(flat(soir()).minHeight).toBeGreaterThanOrEqual(44);
    // « full » (rn.json) : rayon au moins égal à la demi-largeur de l'indicateur.
    const ind = flat(soir().children[0] as never);
    expect(ref.ind!.radius).toBe('full');
    expect(ind.width).toBe(ref.ind!.w);
    expect(Number(ind.borderRadius)).toBeGreaterThanOrEqual(Number(ind.width) / 2);
    await fireEvent.press(soir());
    expect(soir()).toBeChecked();
    expect(matin()).not.toBeChecked();
  });

  test('NoraRadio hors groupe : désactivé', async () => {
    await render(<NoraRadio value="x">Seul</NoraRadio>);
    expect(screen.getByRole('radio', { name: 'Seul' })).toBeDisabled();
  });

  test('NoraSelect : combobox, ouverture de la modale, choix, fermeture', async () => {
    const onChange = jest.fn();
    await render(
      <NoraField label="Ville">
        <NoraSelect
          value="abidjan"
          onChange={onChange}
          options={[
            { label: 'Abidjan', value: 'abidjan' },
            { label: 'Bouaké', value: 'bouake' },
          ]}
        />
      </NoraField>,
    );
    const combo = screen.getByRole('combobox', { name: 'Ville' });
    expect(combo.props.accessibilityValue).toEqual({ text: 'Abidjan' });
    expect(combo).not.toBeExpanded();
    expect(flat(combo).minHeight).toBeGreaterThanOrEqual(44);
    await fireEvent.press(combo);
    expect(screen.getByRole('combobox', { name: 'Ville' })).toBeExpanded();
    expect(screen.getByRole('radio', { name: 'Abidjan' })).toBeChecked();
    await fireEvent.press(screen.getByRole('radio', { name: 'Bouaké' }));
    expect(onChange).toHaveBeenCalledWith('bouake');
    expect(screen.getByRole('combobox', { name: 'Ville' })).not.toBeExpanded();
  });

  test('NoraSelect : « Fermer » referme sans changer la valeur', async () => {
    const onChange = jest.fn();
    await render(<NoraSelect label="Pays" value={null} placeholder="Choisir" onChange={onChange} options={[{ label: 'Côte d’Ivoire', value: 'ci' }]} />);
    await fireEvent.press(screen.getByRole('combobox', { name: 'Pays' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Fermer' }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('combobox', { name: 'Pays' })).not.toBeExpanded();
  });
});

describe('Mouvement réduit', () => {
  const reduce = async () => {
    const { AccessibilityInfo } = jest.requireActual('react-native') as typeof import('react-native');
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
  };

  test('NoraBtn : aucun ressort à l’appui', async () => {
    await reduce();
    const spring = jest.spyOn(Animated, 'spring');
    await render(<NoraBtn onPress={() => {}}>OK</NoraBtn>);
    await act(async () => {});
    await fireEvent(screen.getByRole('button', { name: 'OK' }), 'pressIn');
    await fireEvent(screen.getByRole('button', { name: 'OK' }), 'pressOut');
    expect(spring).not.toHaveBeenCalled();
  });

  test('NoraBtn sans mouvement réduit : ressort à l’appui (le test ci-dessus est discriminant)', async () => {
    const spring = jest.spyOn(Animated, 'spring');
    await render(<NoraBtn onPress={() => {}}>OK</NoraBtn>);
    await act(async () => {});
    await fireEvent(screen.getByRole('button', { name: 'OK' }), 'pressIn');
    expect(spring).toHaveBeenCalled();
  });

  test('NoraSwitch : aucune transition de la pastille', async () => {
    await reduce();
    const timing = jest.spyOn(Animated, 'timing');
    const Host = () => {
      const [v, setV] = React.useState(false);
      return <NoraSwitch checked={v} onChange={setV}>Wi-Fi</NoraSwitch>;
    };
    await render(<Host />);
    await act(async () => {});
    timing.mockClear();
    await fireEvent.press(screen.getByRole('switch', { name: 'Wi-Fi' }));
    expect(screen.getByRole('switch', { name: 'Wi-Fi' })).toBeChecked();
    expect(timing).not.toHaveBeenCalled();
  });

  test('NoraSelect : modale sans animation', async () => {
    await reduce();
    await render(<NoraSelect label="Pays" value="ci" onChange={() => {}} options={[{ label: 'CI', value: 'ci' }]} />);
    await act(async () => {});
    await fireEvent.press(screen.getByRole('combobox', { name: 'Pays' }));
    // Remonte de l'option affichée jusqu'à l'hôte de la modale.
    let node = screen.getByRole('radio', { name: 'CI' }) as { props: Record<string, unknown>; parent: unknown } | null;
    while (node && node.props.animationType === undefined) node = node.parent as typeof node;
    expect(node?.props.animationType).toBe('none');
    expect(node?.props.visible).toBe(true);
  });
});
