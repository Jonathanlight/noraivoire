// NoraIvoire — Cible Flutter : composants de mise en page (lien, navigation, avatar, média).
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
//
// Même contrat que flutter.js : SDK Flutter uniquement, couleurs et dimensions issues de la spec,
// `Semantics` explicite, mouvement réduit respecté (aucune onde ni transition quand il est demandé).

import { resolveRef, camel, pascal, docComment } from '../resolve.js';

const num = (v) => Number(v).toFixed(1);

function colorOf(c, tokens, prop, fallback) {
  const ref = c.tokens[prop];
  if (!ref) return `colors.${fallback}`;
  return `colors.${camel(resolveRef(ref, tokens, { tone: c.defaults.tone, size: c.defaults.size }, `component:${c.component}`).key)}`;
}

function toneSwitch(c, tokens, prop, all) {
  const ref = c.tokens[prop];
  if (!ref) return null;
  const cases = c.variants.tone.map((tone) => {
    const r = resolveRef(ref, tokens, { tone, size: c.defaults.size }, `component:${c.component}`);
    return `      NoraTone.${camel(tone)} => colors.${camel(r.key)},`;
  });
  const covered = all.every((t) => c.variants.tone.includes(t));
  const fallback = covered ? '' : `\n      _ => colors.${camel(resolveRef(ref, tokens, { tone: c.defaults.tone, size: c.defaults.size }).key)},`;
  return `    final ${camel(prop)} = switch (tone) {\n${cases.join('\n')}${fallback}\n    };`;
}

/** `final (padY, padX, fontSize) = switch (size) {…}` ; `sizeVar` : variable Dart portant la taille. */
function sizeSwitch(c, tokens, all, sizeVar = 'size') {
  const row = (s) => {
    const sz = c.sizes[s];
    const v = { tone: c.defaults.tone, size: s };
    return `(${num(resolveRef(sz['pad-y'], tokens, v).value)}, ${num(resolveRef(sz['pad-x'], tokens, v).value)}, ${num(resolveRef(sz.font, tokens, v).value)})`;
  };
  const cases = c.variants.size.map((s) => `      NoraSize.${camel(s)} => ${row(s)},`);
  const covered = all.every((x) => c.variants.size.includes(x));
  return `    final (padY, padX, fontSize) = switch (${sizeVar}) {\n${cases.join('\n')}${covered ? '' : `\n      _ => ${row(c.defaults.size)},`}\n    };`;
}

/** Valeur propre à une taille (côté d'avatar, format de média). */
function extraSwitch(c, all, name, value, sizeVar = 'size') {
  const cases = c.variants.size.map((s) => `      NoraSize.${camel(s)} => ${value(c.sizes[s])},`);
  const covered = all.every((x) => c.variants.size.includes(x));
  return `    final ${name} = switch (${sizeVar}) {\n${cases.join('\n')}${covered ? '' : `\n      _ => ${value(c.sizes[c.defaults.size])},`}\n    };`;
}

function radiusExpr(c, tokens) {
  if (!c.tokens.radius) return '0.0';
  return `NoraRadius.${camel(resolveRef(c.tokens.radius, tokens, { tone: c.defaults.tone, size: c.defaults.size }).key)}`;
}

function linkWidget(c, tokens) {
  const cls = `Nora${pascal(c.component)}`;
  const ring = num(c.states?.focus?.ring ?? 2);
  // Taille absente : le lien hérite de la police du texte (comme sans data-size).
  const fontCases = c.variants.size.map((s) => `      NoraSize.${camel(s)} => ${num(resolveRef(c.sizes[s].font, tokens, { tone: c.defaults.tone, size: s }).value)},`);
  const covered = c._sizes.every((x) => c.variants.size.includes(x));
  const defFont = num(resolveRef(c.sizes[c.defaults.size].font, tokens, c.defaults).value);
  return `/// ${docComment(c.description)}
class ${cls} extends StatefulWidget {
  const ${cls}({
    super.key,
    required this.child,
    this.onPressed,
    this.tone = NoraTone.${camel(c.defaults.tone)},
    this.size,
    this.external = false,
    this.visited = false,
    this.semanticLabel,
  });

  /// Texte du lien (son nom accessible).
  final Widget child;
  final VoidCallback? onPressed;
  final NoraTone tone;

  /// \`null\` : hérite de la police du texte environnant (équivalent d'un lien sans data-size).
  final NoraSize? size;

  /// Lien qui quitte l'application : flèche décorative et indication pour les lecteurs d'écran.
  final bool external;

  /// Lien déjà visité (équivalent de data-visited).
  final bool visited;
  final String? semanticLabel;

  @override
  State<${cls}> createState() => _${cls}State();
}

class _${cls}State extends State<${cls}> {
  bool _hovered = false;
  bool _focused = false;

  @override
  Widget build(BuildContext context) {
    final colors = NoraTheme.of(context).colors;
    final tone = widget.tone;
${toneSwitch(c, tokens, 'fg', c._tones)}
    final visitedColor = ${colorOf(c, tokens, 'visited', 'textMuted')};
    final focus = ${colorOf(c, tokens, 'focus', 'focus')};
    final size = widget.size;
    final double? fontSize = size == null
        ? null
        : switch (size) {
${fontCases.map((l) => `    ${l}`).join('\n')}${covered ? '' : `\n          _ => ${defFont},`}
          };
    final color = widget.visited ? visitedColor : fg;
    final enabled = widget.onPressed != null;
    final rtl = Directionality.of(context) == TextDirection.rtl;

    return Semantics(
      link: true,
      enabled: enabled,
      label: widget.semanticLabel,
      hint: widget.external ? 'ouvre une autre application ou fenêtre' : null,
      child: FocusableActionDetector(
        enabled: enabled,
        mouseCursor: enabled ? SystemMouseCursors.click : MouseCursor.defer,
        onShowHoverHighlight: (v) => setState(() => _hovered = v),
        onShowFocusHighlight: (v) => setState(() => _focused = v),
        actions: <Type, Action<Intent>>{
          ActivateIntent: CallbackAction<ActivateIntent>(onInvoke: (_) {
            widget.onPressed?.call();
            return null;
          }),
        },
        child: GestureDetector(
          onTap: widget.onPressed,
          behavior: HitTestBehavior.opaque,
          child: DecoratedBox(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(2),
              border: Border.all(
                color: _focused ? focus : const Color(0x00000000),
                width: ${ring},
                strokeAlign: BorderSide.strokeAlignOutside,
              ),
            ),
            child: DefaultTextStyle.merge(
              style: TextStyle(
                color: color,
                fontSize: fontSize,
                decoration: TextDecoration.underline,
                decorationColor: color,
                decorationThickness: _hovered || _focused ? 2.0 : 1.0,
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Flexible(child: widget.child),
                  if (widget.external)
                    ExcludeSemantics(
                      child: Text(rtl ? ' \\u2196' : ' \\u2197', style: const TextStyle(decoration: TextDecoration.none)),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}`;
}

function navWidget(c, tokens) {
  const cls = `Nora${pascal(c.component)}`;
  const min = num(c.a11y.minTarget);
  return `/// Lien d'un [${cls}] : \`current\` marque la page courante (aria-current="page").
@immutable
class ${cls}Item {
  const ${cls}Item({required this.label, this.onTap, this.current = false});

  final String label;
  final VoidCallback? onTap;
  final bool current;
}

/// ${docComment(c.description)}
class ${cls} extends StatelessWidget {
  const ${cls}({
    super.key,
    required this.label,
    this.brand,
    this.items = const [],
    this.actions = const [],
    this.size = NoraSize.${camel(c.defaults.size)},
  });

  /// Nom de la navigation (équivalent d'aria-label), annoncé par les lecteurs d'écran.
  final String label;
  final Widget? brand;
  final List<${cls}Item> items;
  final List<Widget> actions;
  final NoraSize size;

  @override
  Widget build(BuildContext context) {
    final colors = NoraTheme.of(context).colors;
    final bg = ${colorOf(c, tokens, 'bg', 'surface')};
    final fg = ${colorOf(c, tokens, 'fg', 'text')};
    final muted = ${colorOf(c, tokens, 'muted', 'textMuted')};
    final border = ${colorOf(c, tokens, 'border', 'border')};
    final active = ${colorOf(c, tokens, 'active', 'primary')};
    final focus = ${colorOf(c, tokens, 'focus', 'focus')};
${sizeSwitch(c, tokens, c._sizes)}
    final reduceMotion = MediaQuery.maybeDisableAnimationsOf(context) ?? false;

    final menu = SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (final item in items)
            Padding(
              padding: EdgeInsetsDirectional.only(end: fontSize * 0.25),
              child: _${cls}Link(
                item: item,
                fontSize: fontSize,
                fg: fg,
                muted: muted,
                active: active,
                focus: focus,
                reduceMotion: reduceMotion,
              ),
            ),
        ],
      ),
    );
    final brandWidget = brand;
    final brandBox = brandWidget == null
        ? const SizedBox.shrink()
        : ConstrainedBox(
            constraints: const BoxConstraints(minHeight: ${min}),
            child: Align(
              alignment: AlignmentDirectional.centerStart,
              widthFactor: 1,
              child: DefaultTextStyle.merge(
                style: TextStyle(color: fg, fontSize: fontSize * 1.125, fontWeight: FontWeight.w700),
                child: brandWidget,
              ),
            ),
          );
    final actionBar = Wrap(spacing: 8, runSpacing: 8, crossAxisAlignment: WrapCrossAlignment.center, children: actions);

    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: label,
      child: DecoratedBox(
        decoration: BoxDecoration(color: bg${c.tokens.border ? ', border: Border(bottom: BorderSide(color: border))' : ''}),
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: padY, horizontal: padX),
          child: DefaultTextStyle.merge(
            style: TextStyle(color: fg, fontSize: fontSize),
            child: Material(
              type: MaterialType.transparency,
              child: LayoutBuilder(
                builder: (context, constraints) {
                  // Petit écran (< 640 px, comme la règle CSS à 40rem) : le menu passe sous la marque et défile.
                  if (constraints.maxWidth < 640) {
                    return Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(children: [Expanded(child: brandBox), actionBar]),
                        SizedBox(height: padY),
                        Align(alignment: AlignmentDirectional.centerStart, child: menu),
                      ],
                    );
                  }
                  return Row(
                    children: [
                      brandBox,
                      const Spacer(),
                      Flexible(child: menu),
                      SizedBox(width: padX),
                      actionBar,
                    ],
                  );
                },
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _${cls}Link extends StatefulWidget {
  const _${cls}Link({
    required this.item,
    required this.fontSize,
    required this.fg,
    required this.muted,
    required this.active,
    required this.focus,
    required this.reduceMotion,
  });

  final ${cls}Item item;
  final double fontSize;
  final Color fg;
  final Color muted;
  final Color active;
  final Color focus;
  final bool reduceMotion;

  @override
  State<_${cls}Link> createState() => _${cls}LinkState();
}

class _${cls}LinkState extends State<_${cls}Link> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    final color = item.current ? widget.active : (_hovered ? widget.fg : widget.muted);
    return Semantics(
      link: true,
      selected: item.current,
      value: item.current ? 'page courante' : null,
      child: InkWell(
        onTap: item.onTap,
        onHover: (v) => setState(() => _hovered = v),
        borderRadius: BorderRadius.circular(NoraRadius.md),
        focusColor: widget.focus.withValues(alpha: 0.24),
        hoverColor: widget.fg.withValues(alpha: 0.06),
        splashFactory: widget.reduceMotion ? NoSplash.splashFactory : null,
        highlightColor: widget.reduceMotion ? const Color(0x00000000) : null,
        child: DecoratedBox(
          decoration: BoxDecoration(
            border: Border(bottom: BorderSide(color: item.current ? widget.active : const Color(0x00000000), width: 2)),
          ),
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: ${min}),
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: widget.fontSize * 0.75),
              child: Center(
                widthFactor: 1,
                child: Text(
                  item.label,
                  style: TextStyle(color: color, fontWeight: item.current ? FontWeight.w600 : FontWeight.w500),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}`;
}

function avatarWidget(c, tokens) {
  const cls = `Nora${pascal(c.component)}`;
  const has = (p) => (c.parts ?? []).includes(p);
  const box = (sz) => num(sz.box);
  const group = has('group') ? `

/// Groupe d'avatars empilés avec chevauchement (équivalent de .${c.component}-group).
/// Les enfants doivent utiliser la même taille que le groupe.
class ${cls}Group extends StatelessWidget {
  const ${cls}Group({super.key, required this.children, this.size = NoraSize.${camel(c.defaults.size)}});

  final List<${cls}> children;
  final NoraSize size;

  @override
  Widget build(BuildContext context) {
    final colors = NoraTheme.of(context).colors;
    final ring = ${colorOf(c, tokens, 'ring', 'surface')};
${extraSwitch(c, c._sizes, 'box', box)}
    final step = box * 0.75;
    return SizedBox(
      width: children.isEmpty ? 0 : box + step * (children.length - 1),
      height: box,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          for (var i = 0; i < children.length; i++)
            PositionedDirectional(
              start: i * step,
              top: 0,
              child: DecoratedBox(
                position: DecorationPosition.foreground,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: ring, width: 2, strokeAlign: BorderSide.strokeAlignOutside),
                ),
                child: children[i],
              ),
            ),
        ],
      ),
    );
  }
}` : '';
  return `/// ${docComment(c.description)}
class ${cls} extends StatelessWidget {
  const ${cls}({
    super.key,
    this.image,
    this.initials,
    this.label,
    this.tone = NoraTone.${camel(c.defaults.tone)},
    this.size = NoraSize.${camel(c.defaults.size)},
  }) : assert(image != null || initials != null, 'image ou initiales attendues');

  final ImageProvider? image;

  /// Initiales affichées sans image (ou si l'image ne se charge pas).
  final String? initials;

  /// Nom annoncé par les lecteurs d'écran ; \`null\` = avatar décoratif (équivalent d'alt="").
  final String? label;
  final NoraTone tone;
  final NoraSize size;

  @override
  Widget build(BuildContext context) {
    final colors = NoraTheme.of(context).colors;
${toneSwitch(c, tokens, 'bg', c._tones)}
${toneSwitch(c, tokens, 'fg', c._tones)}
${sizeSwitch(c, tokens, c._sizes)}
${extraSwitch(c, c._sizes, 'box', box)}
    final initialsText = Center(
      child: Text(
        (initials ?? '').toUpperCase(),
        style: TextStyle(color: fg, fontSize: fontSize, fontWeight: FontWeight.w600, height: 1.0),
      ),
    );
    final img = image;
    final Widget inner = img == null
        ? initialsText
        : Image(
            image: img,
            width: box,
            height: box,
            fit: BoxFit.cover,
            excludeFromSemantics: true,
            errorBuilder: (context, error, stack) => initialsText,
          );
    final avatar = SizedBox.square(
      dimension: box,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(${radiusExpr(c, tokens)}),
        child: ColoredBox(color: bg, child: Padding(padding: EdgeInsets.symmetric(vertical: padY, horizontal: padX), child: inner)),
      ),
    );
    final name = label;
    return name == null ? ExcludeSemantics(child: avatar) : Semantics(image: true, label: name, excludeSemantics: true, child: avatar);
  }
}${group}`;
}

function mediaWidget(c, tokens) {
  const cls = `Nora${pascal(c.component)}`;
  const ratio = (sz) => `${sz.ratio[0]} / ${sz.ratio[1]}`;
  return `/// ${docComment(c.description)}
class ${cls} extends StatelessWidget {
  const ${cls}({super.key, required this.child, this.overlay, this.caption, this.size = NoraSize.${camel(c.defaults.size)}});

  /// Visuel (ex. \`Image(image: …, semanticLabel: '…', fit: BoxFit.cover)\`), recadré au format.
  final Widget child;

  /// Texte en surimpression, posé sur un dégradé de lisibilité (.${c.component}-overlay).
  final Widget? overlay;

  /// Légende sous le visuel (.${c.component}-caption).
  final Widget? caption;

  /// Format : ${c.variants.size.map((s) => `${s} ${ratio(c.sizes[s]).replace(' / ', '/')}`).join(', ')}.
  final NoraSize size;

  @override
  Widget build(BuildContext context) {
    final colors = NoraTheme.of(context).colors;
    final bg = ${colorOf(c, tokens, 'bg', 'surface2')};
    final fg = ${colorOf(c, tokens, 'fg', 'textMuted')};
    final scrim = ${colorOf(c, tokens, 'scrim', 'scrim')};
    final onScrim = ${colorOf(c, tokens, 'on-scrim', 'onScrim')};
${sizeSwitch(c, tokens, c._sizes)}
${extraSwitch(c, c._sizes, 'ratio', ratio)}
    final overlayWidget = overlay;
    final captionWidget = caption;
    final inherited = DefaultTextStyle.of(context).style.fontSize ?? 16.0;
    final visual = ClipRRect(
      borderRadius: BorderRadius.circular(${radiusExpr(c, tokens)}),
      child: AspectRatio(
        aspectRatio: ratio,
        child: Stack(
          fit: StackFit.expand,
          children: [
            ColoredBox(color: bg),
            child,
            if (overlayWidget != null)
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.bottomCenter,
                      end: Alignment.topCenter,
                      colors: [scrim.withValues(alpha: 0.85), scrim.withValues(alpha: 0)],
                    ),
                  ),
                  child: Padding(
                    padding: EdgeInsetsDirectional.fromSTEB(padX, inherited * 3, padX, padY),
                    child: DefaultTextStyle.merge(
                      style: TextStyle(
                        color: onScrim,
                        fontWeight: FontWeight.w600,
                        shadows: const [Shadow(color: Color(0x73000000), offset: Offset(0, 1), blurRadius: 2)],
                      ),
                      child: overlayWidget,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
    return Semantics(
      container: true,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          visual,
          if (captionWidget != null)
            Padding(
              padding: EdgeInsets.only(top: padY),
              child: DefaultTextStyle.merge(style: TextStyle(color: fg, fontSize: fontSize), child: captionWidget),
            ),
        ],
      ),
    );
  }
}`;
}

/** Widget Flutter d'un composant de mise en page, ou null si la forme n'en relève pas. */
export function pageWidget(c, tokens, shape) {
  if (shape === 'link') return linkWidget(c, tokens);
  if (shape === 'nav') return navWidget(c, tokens);
  if (shape === 'avatar') return avatarWidget(c, tokens);
  if (shape === 'media') return mediaWidget(c, tokens);
  return null;
}
