// NoraIvoire — rendu réel des composants de mise en page React Native : lien, navigation, avatar, média.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
import * as React from 'react';
import { Linking, StyleSheet, Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import {
  NoraAvatar,
  NoraAvatarGroup,
  NoraLink,
  NoraMedia,
  NoraNavbar,
  configureNora,
} from '../../packages/core/dist/react-native/noraivoire';
import parity from '../parity/rn.json';

type Entry = Record<string, unknown>;
const P = parity as Record<string, Entry>;
const flat = (el: { props: { style?: unknown } }) => StyleSheet.flatten(el.props.style as never) as Record<string, unknown>;
const hex = (c: unknown) => String(c).toUpperCase();
const radius = (r: unknown) => (r === 'full' ? 9999 : r);
const TONES = ['primary', 'neutral', 'danger', 'success', 'warning'] as const;
const IMG = { uri: 'https://exemple.ci/awa.jpg' };

describe('NoraLink', () => {
  for (const scheme of ['light', 'dark'] as const) {
    for (const tone of TONES) {
      test(`${scheme} ${tone} : couleur, taille et soulignement conformes à rn.json`, async () => {
        configureNora({ scheme });
        await render(<NoraLink tone={tone} size="md" href="/tarifs">Tarifs</NoraLink>);
        const ref = P[`${scheme}/link/${tone}/md`];
        const link = screen.getByRole('link', { name: 'Tarifs' });
        const text = flat(screen.getByText('Tarifs'));
        expect(hex(text.color)).toBe(ref.fg);
        expect(text.fontSize).toBe(ref.font);
        expect(text.textDecorationLine).toBe('underline');
        expect(link).toBeTruthy();
      });
    }
  }

  test('sans size : hérite de la police du texte parent ; visité : couleur atténuée', async () => {
    configureNora({ scheme: 'light' });
    await render(<NoraLink visited href="/a">Déjà lu</NoraLink>);
    const text = flat(screen.getByText('Déjà lu'));
    expect(text.fontSize).toBeUndefined();
    expect(hex(text.color)).toBe(P['light/link/primary/md'].visited);
  });

  test('href : ouverture par configureNora({ openURL }), sinon Linking.openURL ; onPress prioritaire', async () => {
    const openURL = jest.fn();
    configureNora({ openURL });
    await render(<NoraLink href="/tarifs">Tarifs</NoraLink>);
    await act(async () => fireEvent.press(screen.getByRole('link', { name: 'Tarifs' })));
    expect(openURL).toHaveBeenCalledWith('/tarifs');

    configureNora({ openURL: undefined });
    const linking = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await render(<NoraLink href="https://exemple.ci">Site</NoraLink>);
    await act(async () => fireEvent.press(screen.getByRole('link', { name: 'Site' })));
    expect(linking).toHaveBeenCalledWith('https://exemple.ci');

    const onPress = jest.fn();
    await render(<NoraLink href="/x" onPress={onPress}>Action</NoraLink>);
    await act(async () => fireEvent.press(screen.getByRole('link', { name: 'Action' })));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('externe : flèche décorative cachée, indication vocale, nom accessible inchangé', async () => {
    await render(<NoraLink href="https://exemple.ci" external>Partenaire</NoraLink>);
    const link = screen.getByRole('link', { name: 'Partenaire' });
    expect(link.props.accessibilityHint).toMatch(/autre application/);
    const arrow = screen.getByText(' ↗', { includeHiddenElements: true });
    expect(arrow.props.accessibilityElementsHidden).toBe(true);
    expect(arrow.props.importantForAccessibility).toBe('no');
  });
});

describe('NoraNavbar', () => {
  for (const scheme of ['light', 'dark'] as const) {
    for (const size of ['sm', 'md', 'lg'] as const) {
      test(`${scheme} ${size} : barre, liens ≥ 44 px et page courante conformes à rn.json`, async () => {
        configureNora({ scheme });
        await render(
          <NoraNavbar
            label="Principale"
            brand="Marque"
            size={size}
            items={[{ label: 'Accueil', href: '/' }, { label: 'Boutique', href: '/boutique', current: true }]}
          />,
        );
        const ref = P[`${scheme}/navbar/neutral/${size}`];
        const nav = screen.getByLabelText('Principale');
        expect(nav.props.role).toBe('navigation');
        const bar = flat(nav);
        expect(hex(bar.backgroundColor)).toBe(ref.bg);
        expect(bar.paddingVertical).toBe(ref.padY);
        expect(bar.paddingHorizontal).toBe(ref.padX);
        expect(bar.borderBottomWidth).toBe(ref.borderWidth);
        expect(hex(bar.borderBottomColor)).toBe(ref.borderColor);

        const plain = screen.getByRole('link', { name: 'Accueil' });
        const current = screen.getByRole('link', { name: 'Boutique' });
        expect(current).toBeSelected();
        expect(plain).not.toBeSelected();
        expect(current.props.accessibilityValue).toEqual({ text: 'page courante' });
        const box = flat(plain);
        expect(box.minHeight).toBe(ref.linkMinHeight);
        expect(box.minHeight).toBeGreaterThanOrEqual(44);
        expect(box.paddingHorizontal).toBe(ref.linkPadX);
        expect(hex(flat(screen.getByText('Accueil')).color)).toBe(ref.muted);
        expect(hex(flat(screen.getByText('Boutique')).color)).toBe(ref.active);
        expect(hex(flat(screen.getByText('Marque')).color)).toBe(ref.fg);
      });
    }
  }

  test('lien : onPress prioritaire, sinon ouverture de href', async () => {
    const openURL = jest.fn();
    const onPress = jest.fn();
    configureNora({ openURL });
    await render(<NoraNavbar label="N" items={[{ label: 'A', href: '/a' }, { label: 'B', onPress }]} />);
    await act(async () => fireEvent.press(screen.getByRole('link', { name: 'A' })));
    await act(async () => fireEvent.press(screen.getByRole('link', { name: 'B' })));
    expect(openURL).toHaveBeenCalledWith('/a');
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('NoraAvatar', () => {
  for (const scheme of ['light', 'dark'] as const) {
    for (const tone of TONES) {
      test(`${scheme} ${tone} : initiales, couleurs et dimensions conformes à rn.json`, async () => {
        configureNora({ scheme });
        await render(<NoraAvatar initials="ak" label="Awa Koné" tone={tone} />);
        const ref = P[`${scheme}/avatar/${tone}/md`];
        const av = screen.getByRole('image', { name: 'Awa Koné' });
        const st = flat(av);
        expect(hex(st.backgroundColor)).toBe(ref.bg);
        expect(st.width).toBe(ref.w);
        expect(st.height).toBe(ref.h);
        expect(st.borderRadius).toBe(radius(ref.radius));
        const text = flat(screen.getByText('AK', { includeHiddenElements: true }));
        expect(hex(text.color)).toBe(ref.fg);
        expect(text.fontSize).toBe(ref.font);
      });
    }
  }

  test('décoratif sans label : caché aux lecteurs d\'écran', async () => {
    await render(<NoraAvatar initials="YK" />);
    expect(screen.queryByRole('image')).toBeNull();
    const hidden = screen.getByText('YK', { includeHiddenElements: true });
    expect(hidden).toBeTruthy();
  });

  test('image : affichée puis remplacée par les initiales si elle ne se charge pas', async () => {
    await render(<NoraAvatar source={IMG} initials="AK" label="Awa Koné" size="lg" />);
    const [img] = screen.root!.queryAll((n) => n.type === 'Image');
    expect(flat(img).width).toBe(P['light/avatar/neutral/lg'].w);
    await act(async () => img.props.onError());
    expect(screen.getByText('AK', { includeHiddenElements: true })).toBeTruthy();
  });

  test('groupe : chevauchement d\'un quart du côté, anneau de la couleur de surface', async () => {
    configureNora({ scheme: 'light' });
    await render(
      <NoraAvatarGroup size="md">
        <NoraAvatar initials="A" label="A" />
        <NoraAvatar initials="B" label="B" />
      </NoraAvatarGroup>,
    );
    const rings = screen.root!.queryAll((n) => typeof n.type === 'string' && flat(n as never)?.borderWidth === 2);
    expect(rings).toHaveLength(2);
    expect(flat(rings[0] as never).marginStart).toBe(0);
    const ring = flat(rings[1] as never);
    expect(ring.marginStart).toBe(-(P['light/avatar/neutral/md'].w as number) * 0.25);
    expect(ring.borderWidth).toBe(2);
    expect(hex(ring.borderColor)).toBe('#FFFFFF');
  });
});

describe('NoraMedia', () => {
  for (const scheme of ['light', 'dark'] as const) {
    for (const size of ['wide', 'standard', 'square', 'portrait'] as const) {
      test(`${scheme} ${size} : format, légende et surimpression conformes à rn.json`, async () => {
        configureNora({ scheme });
        await render(<NoraMedia source={IMG} alt="Plage" size={size} overlay="Grand-Bassam" caption="Crédit" />);
        const ref = P[`${scheme}/media/neutral/${size}`];
        const img = screen.getByRole('image', { name: 'Plage' });
        const frame = flat(img.parent as never);
        expect(Number(frame.aspectRatio).toFixed(3)).toBe(ref.ratio);
        expect(frame.borderRadius).toBe(radius(ref.radius));
        const cap = flat(screen.getByText('Crédit'));
        expect(hex(cap.color)).toBe(ref.captionFg);
        expect(cap.fontSize).toBe(ref.captionFont);
        expect(flat(screen.getByText('Crédit').parent as never).paddingTop).toBe(ref.captionPadY);
        expect(hex(flat(screen.getByText('Grand-Bassam')).color)).toBe(ref.onScrim);
      });
    }
  }

  test('sans alt : image non annoncée ; visuel personnalisé accepté', async () => {
    await render(<NoraMedia source={IMG} />);
    expect(screen.queryByRole('image')).toBeNull();
    await render(<NoraMedia><Text>Illustration</Text></NoraMedia>);
    expect(screen.getByText('Illustration')).toBeTruthy();
  });
});
