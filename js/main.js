
// ==========================================
// 1. GLOBAL STATE & APP DATA
// ==========================================

window.colorPalette = ["#0F172A", "#1E293B", "#6366F1", "#A78BFA", "#F8FAFC"];
window.lockedColors = [false, false, false, false, false];

const GALLERY_KEY = 'vibrantImpactGallery';
const FAVORITES_KEY = 'vibrantImpactFavoriteFonts';

const getDefaultState = () => ({
    id: null,
    thumbnailUrl: null,
    aspectRatio: '1:1',
    showTextOverlay: true,
    useQuote: true,
    customText: '',
    quoteText: 'Start a new design now.',
    quoteAuthor: '',
    showQuoteMarks: false,
    quoteMarkStyle: 'classic',
    quoteMarkSize: 1.5,
    quoteMarkOpacity: 100,
    quoteMarksAsFrame: false,
    quoteMarkColor: '#ffffff',
    fontFamily: 'Montserrat',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'normal',
    lineHeight: 1.4,
    letterSpacing: 0,
    textColor: '#ffffff',
    textCase: 'none',
    backgroundColor: '#1a1a2e',
    backgroundType: 'gradient',
    gradientMode: 'twoStop',
    backgroundImage: null,
    imageScale: 100,
    imagePosition: { x: 50, y: 50 },
    imageBlur: 0,
    imageBrightness: 100,
    lockedColors: [false, false, false, false, false],
    gradientStart: '#4b0082',
    gradientEnd: '#ff00ff',
    gradientDirection: 'to bottom right',
    overlayOpacity: 20,
    textBoxBackgroundColor: '#000000',
    textBoxWidth: 60,
    textBoxHeight: 30,
    textBoxPosition: { x: 50, y: 50 },
    textBoxBorderRadius: 16,
    textBoxPadding: 20,
    textStrokeEnabled: false,
    textStrokeWidth: 0.5,
    textStrokeColor: '#000000',
    textShadowEnabled: false,
    textShadowColor: '#000000',
    textShadowBlur: 4,
    textShadowOffsetX: 2,
    textShadowOffsetY: 2,
    emojis: []
});

let currentDesignState = getDefaultState();

// Global App State (For fetched data and transient UI status)
let quotes = [];
let allQuotes = [];
let availableFonts = [];
let favoriteFonts = [];
let colorPalette = [];
let isDownloading = false;
let emojiSearchResults = [];
let selectedEmojiId = null;
let previousBackgroundState = null;

// ==========================================
// 2. CORE ENGINE: RENDER CANVAS
// ==========================================

function renderCanvas() {
    const state = currentDesignState;
    const wrapper = document.getElementById('aspectRatioWrapper');
    const canvasTarget = document.getElementById('canvasExportTarget');
    const quoteEl = document.getElementById('quoteText');
    const authorEl = document.getElementById('quoteAuthor');
    const backgroundLayer = document.getElementById('backgroundLayer');
    const textContainer = document.getElementById('textContainer');

    if (!state || !canvasTarget || !wrapper || !quoteEl || !authorEl || !backgroundLayer || !textContainer) return;

    void wrapper.offsetWidth;

    // --- 2.1 MASTER SCALING ENGINE ---
    const [ratioW, ratioH] = state.aspectRatio.split(':').map(Number);
    const ratioValue = ratioW / ratioH;

    wrapper.style.width = '';
    wrapper.style.height = '';

    const windowWidth = window.innerWidth;

    if (windowWidth <= 900) {
        // Mobile Logic (stays as you have it)
        const maxMobWidth = windowWidth * 0.9; 
        const maxMobHeight = window.innerHeight * 0.38; 

        if (ratioValue < (maxMobWidth / maxMobHeight)) {
            wrapper.style.height = `${maxMobHeight}px`;
            wrapper.style.width = `${maxMobHeight * ratioValue}px`;
        } else {
            wrapper.style.width = `${maxMobWidth}px`;
            wrapper.style.height = `${maxMobWidth / ratioValue}px`;
        }
    } else {
        const maxDesktopHeight = window.innerHeight * 0.70; 
        const maxDesktopWidth = windowWidth - 480; 

        if (ratioValue < (maxDesktopWidth / maxDesktopHeight)) {
            wrapper.style.height = `${maxDesktopHeight}px`;
            wrapper.style.width = `${maxDesktopHeight * ratioValue}px`;
        } else {
            wrapper.style.width = `${maxDesktopWidth}px`;
            wrapper.style.height = `${maxDesktopWidth / ratioValue}px`;
        }
    }

    // --- 2.2 BACKGROUND LAYER ---
    backgroundLayer.style.filter = 'none';
    backgroundLayer.style.position = 'absolute';
    backgroundLayer.style.top = '0';
    backgroundLayer.style.left = '0';
    backgroundLayer.style.width = '100%';
    backgroundLayer.style.height = '100%';
    backgroundLayer.style.transform = 'none'; 

    if (state.backgroundType === 'solid') {
        backgroundLayer.style.backgroundImage = 'none';
        backgroundLayer.style.backgroundColor = state.backgroundColor;
        backgroundLayer.style.backgroundSize = 'auto'; 
    } else if (state.backgroundType === 'image' && state.backgroundImage) {
        backgroundLayer.style.backgroundColor = 'transparent';
        backgroundLayer.style.backgroundImage = `url(${state.backgroundImage})`;
        backgroundLayer.style.backgroundSize = 'contain'; 
        backgroundLayer.style.backgroundRepeat = 'no-repeat';
        backgroundLayer.style.backgroundPosition = 'center';
        const offsetX = (state.imagePosition.x - 50) * 2; 
        const offsetY = (state.imagePosition.y - 50) * 2;
        backgroundLayer.style.transform = `translate(${offsetX}%, ${offsetY}%) scale(${state.imageScale / 100})`;
        backgroundLayer.style.filter = `blur(${state.imageBlur}px) brightness(${state.imageBrightness}%)`;
    } else {
        // GRADIENT LOGIC
        backgroundLayer.style.backgroundColor = 'transparent';
        
        let colorString = "";
        if (state.gradientMode === 'twoStop') {
            colorString = `${state.gradientStart}, ${state.gradientEnd}`;
        } else {
            colorString = (window.colorPalette && window.colorPalette.length > 0) 
                ? window.colorPalette.join(',') 
                : `${state.gradientStart}, ${state.gradientEnd}`;
        }

        const isRadial = state.gradientDirection.includes('circle');
        const gradientFunc = isRadial ? 'radial-gradient' : 'linear-gradient';
        
        backgroundLayer.style.backgroundImage = `${gradientFunc}(${state.gradientDirection}, ${colorString})`;
    }

    textContainer.style.backgroundColor = getRgbaFromHex(state.textBoxBackgroundColor, state.overlayOpacity);

    quoteEl.style.color = state.textColor;
    authorEl.style.color = state.textColor;


    // --- 2.3 TEXT BOX GEOMETRY ---
    textContainer.classList.toggle('no-box', !state.showTextOverlay);
    textContainer.style.setProperty('--box-width', `${state.textBoxWidth}%`);
    textContainer.style.setProperty('--box-height', `${state.textBoxHeight}%`);
    textContainer.style.setProperty('--box-radius', `${state.textBoxBorderRadius}px`);
    textContainer.style.setProperty('--box-padding', `${state.textBoxPadding}px`);
    textContainer.style.setProperty('--box-bg', getRgbaFromHex(state.textBoxBackgroundColor, state.overlayOpacity));
    quoteEl.style.setProperty('--text-weight', state.fontWeight);

    const effectiveWidthPercent = state.showTextOverlay ? state.textBoxWidth : 95;
    const boxWidthPx = (wrapper.offsetWidth * effectiveWidthPercent) / 100;
    
    if (state.showTextOverlay) {
        textContainer.style.display = 'flex';
        textContainer.style.width = `${state.textBoxWidth}%`;
        textContainer.style.height = `${state.textBoxHeight}%`;
        textContainer.style.padding = `${state.textBoxPadding}px`;
        textContainer.style.borderRadius = `${state.textBoxBorderRadius}px`;
        textContainer.style.backgroundColor = getRgbaFromHex(state.textBoxBackgroundColor, state.overlayOpacity);
        textContainer.style.left = `${state.textBoxPosition.x}%`;
        textContainer.style.top = `${state.textBoxPosition.y}%`;
        textContainer.style.transform = 'translate(-50%, -50%)';
    } else {
        textContainer.style.display = 'flex';
        textContainer.style.width = '100%';   
        textContainer.style.height = '100%';  
        textContainer.style.backgroundColor = 'transparent';
        textContainer.style.borderRadius = '0';
        textContainer.style.padding = '40px'; 
    }

    textContainer.style.left = `${state.textBoxPosition.x}%`;
    textContainer.style.top = `${state.textBoxPosition.y}%`;
    textContainer.style.transform = 'translate(-50%, -50%)';

    // --- 2.4 TYPOGRAPHY ---
    const isQuoteMode = state.useQuote === true;
    const activeText = isQuoteMode ? state.quoteText : state.customText || 'Your message here...';
    const mobileScaleDivisor = window.innerWidth <= 900 ? (state.showTextOverlay ? 15 : 8) : 10;
    const autoFitFontSize = boxWidthPx / mobileScaleDivisor;
    const finalFontSize = Math.min(state.fontSize, autoFitFontSize);

    quoteEl.style.setProperty('font-family', state.fontFamily, 'important');
    quoteEl.style.setProperty('font-size', `${finalFontSize}px`, 'important');
    quoteEl.style.setProperty('line-height', state.lineHeight, 'important');
    quoteEl.style.setProperty('letter-spacing', `${state.letterSpacing}px`, 'important');
    quoteEl.style.color = state.textColor;
    quoteEl.style.textAlign = state.textAlign;
    quoteEl.style.fontWeight = state.fontWeight;
    authorEl.style.fontWeight = state.fontWeight;

    if (isQuoteMode && state.quoteAuthor && state.quoteAuthor.trim() !== '') {
        authorEl.style.display = 'block';
        authorEl.textContent = `— ${state.quoteAuthor}`;
        let authorSize = finalFontSize * 0.6;
        if (authorSize < 10) authorSize = 10;
        if (authorSize > finalFontSize * 0.8) authorSize = finalFontSize * 0.8;
        authorEl.style.setProperty('font-size', `${authorSize}px`, 'important');
        authorEl.style.setProperty('font-family', state.fontFamily, 'important');
        authorEl.style.color = state.textColor;
        authorEl.style.textAlign = state.textAlign;
        authorEl.style.width = '100%';
    } else {
        authorEl.style.display = 'none';
        authorEl.textContent = '';
    }

    // --- 2.5 QUOTATION MARKS ---
    quoteEl.innerHTML = ''; 
    textContainer.querySelectorAll('.quoteMark.frameMode').forEach(el => el.remove());

    if (state.showQuoteMarks) {
        const activeText = state.useQuote ? state.quoteText : state.customText;

    if (state.quoteMarksAsFrame) {
        const styleClass = `mark${state.quoteMarkStyle.charAt(0).toUpperCase() + state.quoteMarkStyle.slice(1)}`;
        const openingChar = state.quoteMarkStyle === 'modern' ? '「' : '“';
        const closingChar = state.quoteMarkStyle === 'modern' ? '」' : '”';

        const applyFrameStyles = (el) => {
            el.className = `quoteMark frameMode ${styleClass}`;
            const baseFrameSize = 60; 
            el.style.fontSize = `${baseFrameSize * state.quoteMarkSize}px`;
            el.style.color = state.quoteMarkColor; // Exclusive to corners
            el.style.opacity = state.quoteMarkOpacity / 100; // Exclusive to corners
            el.style.position = 'absolute';
        };

        const openingMark = document.createElement('span');
        applyFrameStyles(openingMark);
        openingMark.classList.add('openingFrame');
        openingMark.textContent = openingChar;
        const closingMark = document.createElement('span');
        applyFrameStyles(closingMark);
        closingMark.classList.add('closingFrame');
        closingMark.textContent = closingChar;

        textContainer.appendChild(openingMark);
        textContainer.appendChild(closingMark);
        quoteEl.textContent = activeText;
    } else {
            const openingChar = '“';
            const closingChar = '”';
            quoteEl.textContent = `${openingChar}${activeText}${closingChar}`;
        }
    } else {
        quoteEl.textContent = state.useQuote ? state.quoteText : state.customText;
    }

    // --- 2.6 TEXT EFFECTS & CASE ---
    quoteEl.style.textTransform = state.textCase === 'uppercase' ? 'uppercase' : state.textCase === 'title' ? 'capitalize' : 'none';
    quoteEl.style.fontVariant = state.textCase === 'small-caps' ? 'small-caps' : 'normal';
    const shadows = [];
    if (state.textStrokeEnabled && state.textStrokeWidth > 0) {
        const w = state.textStrokeWidth;
        const c = state.textStrokeColor;
        shadows.push(
        `${w}px ${w}px 0 ${c}, -${w}px ${w}px 0 ${c}, ${w}px -${w}px 0 ${c}, -${w}px -${w}px 0 ${c}`
        );
    }
    if (state.textShadowEnabled) {
        shadows.push(`${state.textShadowOffsetX}px ${state.textShadowOffsetY}px ${state.textShadowBlur}px ${state.textShadowColor}`);
    }
    const shadowValue = shadows.join(', ') || 'none';
    quoteEl.style.textShadow = shadowValue;
    authorEl.style.textShadow = shadowValue;

    // --- 2.7 EMOJI LAYERS ---
    const existing = canvasTarget.querySelectorAll('.emojiLayer');
    existing.forEach(el => el.remove());

    state.emojis.forEach(emoji => {
        const emojiEl = document.createElement('div');
        emojiEl.textContent = emoji.char;
        emojiEl.className = `emojiLayer ${emoji.id === selectedEmojiId ? 'selected' : ''}`;
        emojiEl.style.cssText = `
            position: absolute;
            z-index: 30;
            left: ${emoji.x}%;
            top: ${emoji.y}%;
            font-size: ${emoji.size}px;
            color: ${emoji.color};
            transform: translate(-50%, -50%) rotate(${emoji.rotation}deg);
            cursor: pointer;
            user-select: none;`;
        emojiEl.onclick = e => {
            e.stopPropagation();
            selectEmojiLayer(emoji.id);
        };
        canvasTarget.appendChild(emojiEl);
    });
}
    

// ==========================================
// 3. UI SYNC & SIDEBAR CONTROLS
// ==========================================

function renderSidebarControls() {
    const syncSlider = (id, value, displayId, unit = '') => {
        const slider = document.getElementById(id);
        const display = document.getElementById(displayId);
        if (slider) slider.value = value;
        if (display) display.textContent = value + unit;
    };

    // 3.1 Sliders
    syncSlider('fontSizeRange', currentDesignState.fontSize, 'fontSizeDisplay', 'px');
    syncSlider('lineHeightRange', currentDesignState.lineHeight, 'lineHeightDisplay');
    syncSlider('letterSpacingRange', currentDesignState.letterSpacing, 'letterSpacingDisplay', 'px');
    syncSlider('textBoxWidthRange', currentDesignState.textBoxWidth, 'textBoxWidthDisplay', '%');
    syncSlider('textBoxHeightRange', currentDesignState.textBoxHeight, 'textBoxHeightDisplay', '%');
    syncSlider('textBoxPaddingInput', currentDesignState.textBoxPadding, 'textBoxPaddingDisplay', 'px');
    syncSlider('textBoxRadiusInput', currentDesignState.textBoxBorderRadius, 'textBoxBorderRadiusDisplay', 'px');
    syncSlider('imageScaleRange', currentDesignState.imageScale, 'imageScaleDisplay');
    syncSlider('imageBlurRange', currentDesignState.imageBlur, 'imageBlurDisplay', 'px');
    syncSlider('imageBrightnessRange', currentDesignState.imageBrightness, 'imageBrightnessDisplay', '%');
    syncSlider('textBoxXRange', currentDesignState.textBoxPosition.x, 'textBoxXDisplay', '%');
    syncSlider('textBoxYRange', currentDesignState.textBoxPosition.y, 'textBoxYDisplay', '%');
    syncSlider('imageXRange', currentDesignState.imagePosition.x, 'imageXDisplay', '%');
    syncSlider('imageYRange', currentDesignState.imagePosition.y, 'imageYDisplay', '%');
    syncSlider('shadowBlurRange', currentDesignState.textShadowBlur, 'shadowBlurDisplay', 'px');
    syncSlider('shadowXRange', currentDesignState.textShadowOffsetX, 'shadowXDisplay', 'px');
    syncSlider('shadowYRange', currentDesignState.textShadowOffsetY, 'shadowYDisplay', 'px');
    syncSlider('textBoxOpacityRange', currentDesignState.overlayOpacity, 'textBoxOpacityDisplay', '%');
    syncSlider('quoteMarkOffset', currentDesignState.quoteMarkOffset, 'quoteMarkOffsetDisplay', 'px');
    syncSlider('quoteMarkSize', currentDesignState.quoteMarkSize, 'quoteMarkSizeDisplay', ' Scale');
    syncSlider('quoteMarkOpacity', currentDesignState.quoteMarkOpacity, 'quoteMarkOpacityDisplay', '%');

    // 3.2 Color Pickers
    const syncColorPicker = (colorInputId, hexInputId, value) => {
            if (!value) return;
            const normalized = value.toUpperCase();
            const colorInput = document.getElementById(colorInputId);
            const hexInput = document.getElementById(hexInputId);
            if (colorInput) colorInput.value = normalized;
            if (hexInput) hexInput.value = normalized;
            const box = colorInput?.parentElement?.querySelector('.colorBox');
            if (box) box.style.backgroundColor = normalized;
        };

    syncColorPicker('textColorInput', 'customTextColorHex', currentDesignState.textColor);
    syncColorPicker('strokeColorInput', 'customStrokeColorHex', currentDesignState.textStrokeColor);
    syncColorPicker('textBoxColorInput', 'customTextBoxColorHex', currentDesignState.textBoxBackgroundColor);
    syncColorPicker('solidColorInput', 'customSolidBgColorHex', currentDesignState.backgroundColor);
    syncColorPicker('gradientStartInput', 'customGradientStartHex', currentDesignState.gradientStart);
    syncColorPicker('gradientEndInput', 'customGradientEndHex', currentDesignState.gradientEnd);
    syncColorPicker('shadowColorInput', 'customShadowColorHex', currentDesignState.textShadowColor);
    syncColorPicker('quoteMarkColorInput', 'customQuoteMarkColorHex', currentDesignState.quoteMarkColor);

    // 3.3 Alignment Buttons
    const align = currentDesignState.textAlign;
    const alignBtns = {
            left: document.getElementById('alignLeft'),
            center: document.getElementById('alignCenter'),
            right: document.getElementById('alignRight')
    };
    if (alignBtns.left) alignBtns.left.classList.toggle('selected', align === 'left');
    if (alignBtns.center) alignBtns.center.classList.toggle('selected', align === 'center');
    if (alignBtns.right) alignBtns.right.classList.toggle('selected', align === 'right');

    // 3.4 Quote search UI
    const quoteSearch = document.getElementById('quoteSearchFilter');
    const clearBtn = document.getElementById('clearQuoteSearch');
    const regenBtn = document.getElementById('regenSearch');
    if (quoteSearch && clearBtn && regenBtn) {
            const hasText = quoteSearch.value.trim() !== '';
            clearBtn.style.display = hasText ? 'inline-block' : 'none';
            regenBtn.style.display = hasText ? 'inline-block' : 'none';
    }

    // 3.5 Quotation marks
    const isShowMarks = currentDesignState.showQuoteMarks;
    const isFrameMode = currentDesignState.quoteMarksAsFrame;
    const frameGroup = document.getElementById('quoteMarksAsFrameGroup');
    if (frameGroup) {
        frameGroup.style.display = isShowMarks ? 'flex' : 'none';
    }

    const showQuotesToggle = document.getElementById('showQuotesToggle');
    if (showQuotesToggle) showQuotesToggle.checked = isShowMarks;

    const frameToggle = document.getElementById('quoteMarksAsFrameToggle');
    if (frameToggle) frameToggle.checked = isFrameMode;

    const quoteStyleControls = document.getElementById('quoteStyleControls');
    if (quoteStyleControls) {
        quoteStyleControls.style.display = isShowMarks ? 'block' : 'none';
    }

    const boldToggle = document.getElementById('boldToggle');
    if (boldToggle) boldToggle.checked = currentDesignState.fontWeight === 'bold';

    const cornerControls = [
        document.getElementById('quoteMarkSizeGroup'),
        document.getElementById('quoteMarkColorGroup'),
        document.getElementById('quoteMarkOpacityGroup'),
        document.getElementById('quoteMarkStyleGroup')
    ];

    const showCornerEditTools = isShowMarks && isFrameMode;

    cornerControls.forEach(el => {
        if (el) el.style.display = showCornerEditTools ? 'block' : 'none';
    });

    syncSlider('quoteMarkSize', currentDesignState.quoteMarkSize, 'quoteMarkSizeDisplay', isFrameMode ? ' Scale' : 'x');
    syncSlider('quoteMarkOpacity', currentDesignState.quoteMarkOpacity, 'quoteMarkOpacityDisplay', '%');
    syncColorPicker('quoteMarkColorInput', 'customQuoteMarkColorHex', currentDesignState.quoteMarkColor);

    // 3.6 Background controls visibility
    const type = currentDesignState.backgroundType;
    const isGradient = type === 'gradient';
    const gMode = currentDesignState.gradientMode;

    const controls = {
            solid: document.getElementById('solidControls'),
            gradColors: document.getElementById('gradientColorControls'),
            image: document.getElementById('imageControls'),
            gMode: document.getElementById('gradientModeControls'),
            palette: document.getElementById('paletteSection'),
            direction: document.getElementById('gradientDirectionControls')
    };

    if (controls.solid) controls.solid.style.display = type === 'solid' ? 'block' : 'none';
    if (controls.gradColors) controls.gradColors.style.display = isGradient && gMode === 'twoStop' ? 'block' : 'none';
    if (controls.image) controls.image.style.display = type === 'image' ? 'block' : 'none';
    if (controls.gMode) controls.gMode.style.display = isGradient ? 'block' : 'none';
    if (controls.palette) controls.palette.style.display = isGradient && gMode === 'palette' ? 'block' : 'none';
    if (controls.direction) controls.direction.style.display = isGradient ? 'block' : 'none';
    
    const bgSolid = document.getElementById('bgTypeSolid');
    const bgGrad = document.getElementById('bgTypeGradient');
    const bgImg = document.getElementById('bgTypeImage');
    if (bgSolid) bgSolid.classList.toggle('selected', currentDesignState.backgroundType === 'solid');
    if (bgGrad) bgGrad.classList.toggle('selected', currentDesignState.backgroundType === 'gradient');
    if (bgImg) bgImg.classList.toggle('selected', currentDesignState.backgroundType === 'image');

    const gmBtns = {
            two: document.getElementById('gradientModeTwoStop'),
            pal: document.getElementById('gradientModePalette')
    };
    if (gmBtns.two) gmBtns.two.classList.toggle('selected', gMode === 'twoStop');
    if (gmBtns.pal) gmBtns.pal.classList.toggle('selected', gMode === 'palette');

    // 3.7 Stroke & shadow toggles
    const strokeToggle = document.getElementById('strokeToggle');
    const strokePanel = document.getElementById('strokeControls');
    if (strokeToggle) strokeToggle.checked = currentDesignState.textStrokeEnabled;
    if (strokePanel) strokePanel.style.display = currentDesignState.textStrokeEnabled ? 'block' : 'none';

    const shadowToggle = document.getElementById('shadowToggle');
    const shadowPanel = document.getElementById('shadowControls');
    if (shadowToggle) shadowToggle.checked = currentDesignState.textShadowEnabled;
    if (shadowPanel) shadowPanel.style.display = currentDesignState.textShadowEnabled ? 'block' : 'none';

    // 3.8 Text mode toggle
    const useQuote = currentDesignState.useQuote;
    const qPanel = document.getElementById('quoteControls');
    const cPanel = document.getElementById('customTextControls');
    const cInput = document.getElementById('customTextInput');

    if (qPanel) qPanel.style.display = useQuote ? 'block' : 'none';
    if (cPanel) {
        cPanel.style.display = useQuote ? 'none' : 'block';
        if (cInput) cInput.value = currentDesignState.customText;
    }
    document.getElementById('textModeQuote')?.classList.toggle('selected', useQuote);
    document.getElementById('textModeCustom')?.classList.toggle('selected', !useQuote);

    // 3.9 Quote list
    const quotesList = document.getElementById('quotesList');
    if (quotesList) {
        quotesList.innerHTML = '';
        if (quotes.length === 0) {
            quotesList.innerHTML = '<p>No quotes found.</p>';
        } else {
            const searchTerm = quoteSearch?.value.toLowerCase().trim() || '';
            quotes.forEach(q => {
            const item = document.createElement('div');
            const isActive = q.quoteText === currentDesignState.quoteText;
            item.className = `quoteItem ${isActive ? 'activeQuote' : ''}`;

            const p = document.createElement('p');
            p.appendChild(document.createTextNode('"'));
            highlightText(q.quoteText, searchTerm).forEach(node => p.appendChild(node));
            p.appendChild(document.createTextNode('"'));

            const small = document.createElement('small');
            small.textContent = `— ${q.authorName}`;

            item.appendChild(p);
            item.appendChild(small);
            item.onclick = () => selectQuote(q.quoteText.replace(/'/g, "\\'"), q.authorName.replace(/'/g, "\\'"));
            quotesList.appendChild(item);
            });
        }
    }

    // 3.10 Font dropdown
    const fontSelect = document.getElementById('fontFamilySelect');
    if (fontSelect && availableFonts.length > 0) {
        fontSelect.innerHTML = '';
        const favs = new Set(favoriteFonts);

    if (favs.size > 0) {
        const favGroup = document.createElement('optgroup');
        favGroup.label = '⭐ Favorites';
        availableFonts
            .filter(f => favs.has(f))
            .forEach(f => {
                const opt = new Option(f, f);
                if (f === currentDesignState.fontFamily) opt.selected = true;
                favGroup.appendChild(opt);
            });
        fontSelect.appendChild(favGroup);

        const sep = new Option('──────────');
        sep.disabled = true;
        fontSelect.appendChild(sep);
    }

        availableFonts
          .filter(f => !favs.has(f))
          .forEach(f => {
              const opt = new Option(f, f);
              if (f === currentDesignState.fontFamily) opt.selected = true;
              fontSelect.appendChild(opt);
          });

        fontSelect.value = currentDesignState.fontFamily;
        syncFavoriteToggle();
  }

  // Section 3.11 Emoji UI Sync
  const emojiList = document.getElementById('activeEmojisList');
    if (emojiList) {
        emojiList.style.display = currentDesignState.emojis.length > 0 ? 'block' : 'none';
    }
  const emojiGallery = document.getElementById('activeEmojisGallery');
  const emojiPanel = document.getElementById('selectedEmojiPanel');

  if (emojiList) emojiList.style.display = currentDesignState.emojis.length > 0 ? 'block' : 'none';
  if (emojiGallery) {
    emojiGallery.innerHTML = '';
    currentDesignState.emojis.forEach(e => {
      const div = document.createElement('div');
      div.textContent = e.char;
      div.className = `activeEmojiItem ${e.id === selectedEmojiId ? 'selected' : ''}`;
      div.onclick = () => selectEmojiLayer(e.id);
      emojiGallery.appendChild(div);
    });
  }

  const selectedEmoji = currentDesignState.emojis.find(e => e.id === selectedEmojiId);
  if (selectedEmoji && emojiPanel) {
        emojiPanel.style.display = 'block';
        
        const charDisp = document.getElementById('selectedEmojiCharDisplay');
        if (charDisp) charDisp.textContent = selectedEmoji.char;

        syncSlider('emojiSizeRange', selectedEmoji.size, 'emojiSizeDisplay', 'px');
        syncSlider('emojiRotationRange', selectedEmoji.rotation, 'emojiRotationDisplay', '°');
        syncSlider('emojiXRange', selectedEmoji.x, 'emojiXDisplay', '%');
        syncSlider('emojiYRange', selectedEmoji.y, 'emojiYDisplay', '%');
        syncColorPicker('emojiColorInput', 'customEmojiColorHex', selectedEmoji.color);
    } else if (emojiPanel) {
        emojiPanel.style.display = 'none';
  }

    // Section 3.12 Box UI Sync
    const boxToggle = document.getElementById('showTextBoxToggle');
    const boxPanel = document.getElementById('boxEditingControls');

    if (boxToggle) boxToggle.checked = currentDesignState.showTextOverlay;
    if (boxPanel) {
        // Hide all the box sliders if the box isn't being used
        boxPanel.style.display = currentDesignState.showTextOverlay ? 'block' : 'none';
    }

}

// ==========================================
// 4. STATE HANDLERS
// ==========================================

function updateDesignState(keyOrUpdates, value) {
    if (typeof keyOrUpdates === 'object' && keyOrUpdates !== null) {
        currentDesignState = { ...currentDesignState, ...keyOrUpdates };
    } else if (typeof keyOrUpdates === 'string') {
        currentDesignState[keyOrUpdates] = value;
    }
    if (currentDesignState.backgroundType !== 'image') {
        currentDesignState.backgroundImage = null;
    }
    renderCanvas();
    renderSidebarControls();
}

function clampBoxPosition(state) {
    const halfWidth = state.textBoxWidth / 2;
    const halfHeight = state.textBoxHeight / 2;
    const clampedX = Math.min(Math.max(state.textBoxPosition.x, halfWidth), 100 - halfWidth);
    const clampedY = Math.min(Math.max(state.textBoxPosition.y, halfHeight), 100 - halfHeight);
    return { x: clampedX, y: clampedY };
}

function handleRangeUpdate(key, value, displayId, unit = '') {
  const parsedValue = parseFloat(value);
  currentDesignState[key] = Number.isNaN(parsedValue) ? 0 : parsedValue;
  const displayElement = document.getElementById(displayId);
  if (displayElement) displayElement.textContent = currentDesignState[key] + unit;
  renderCanvas();
}

function handlePositionUpdate(stateKey, axis, value, displayId) {
  const intValue = parseInt(value, 10);
  currentDesignState[stateKey] = { ...currentDesignState[stateKey], [axis]: intValue };
  const display = document.getElementById(displayId);
  if (display) display.textContent = intValue + '%';
  renderCanvas();
}

function setTextMode(useQuote) {
  updateDesignState({
    useQuote,
    quoteText: currentDesignState.quoteText,
    quoteAuthor: currentDesignState.quoteAuthor
  });
}

function resetBoxToDefaults() {
    const defaults = getDefaultState();
    updateDesignState({
        showTextOverlay: defaults.showTextOverlay,
        textBoxBackgroundColor: defaults.textBoxBackgroundColor,
        textBoxWidth: defaults.textBoxWidth,
        textBoxHeight: defaults.textBoxHeight,
        textBoxBorderRadius: defaults.textBoxBorderRadius,
        textBoxPadding: defaults.textBoxPadding,
        overlayOpacity: defaults.overlayOpacity
    });
}

// ==========================================
// 5. BACKGROUND & PRESETS
// ==========================================

function previewBackgroundMode(type) {
  updateDesignState('backgroundType', type);
  const solidControls = document.getElementById('solidControls');
  const imageControls = document.getElementById('imageControls');
  const gradientModeControls = document.getElementById('gradientModeControls');
  const paletteSection = document.getElementById('paletteSection');
  const gradientColorControls = document.getElementById('gradientColorControls');
  const directionControls = document.getElementById('gradientDirectionControls');
  if (solidControls) solidControls.style.display = type === 'solid' ? 'block' : 'none';
  if (imageControls) imageControls.style.display = type === 'image' ? 'block' : 'none';
  if (gradientModeControls) gradientModeControls.style.display = type === 'gradient' ? 'block' : 'none';
  if (type !== 'gradient') {
    if (paletteSection) paletteSection.style.display = 'none';
    if (gradientColorControls) gradientColorControls.style.display = 'none';
    if (directionControls) {directionControls.style.display = type === 'gradient' ? 'block' : 'none';}
  }
  document.getElementById('bgTypeSolid')?.classList.toggle('selected', type === 'solid');
  document.getElementById('bgTypeGradient')?.classList.toggle('selected', type === 'gradient');
  document.getElementById('bgTypeImage')?.classList.toggle('selected', type === 'image');
  renderSidebarControls();
}

function applyTwoColorGradient() {
  updateDesignState({ backgroundType: 'gradient', gradientMode: 'twoStop',backgroundImage: null});
}

function applyBoxPreset(type) {
  let updates = {};
  switch (type) {
    case 'frosted':
      updates = {
        textBoxBackgroundColor: '#ffffff',
        overlayOpacity: 15,
        textBoxBorderRadius: 20,
        textBoxPadding: 30,
        textBoxWidth: 70,
        textBoxHeight: 40
      };
      break;
    case 'minimal':
      updates = {
        textBoxBackgroundColor: '#000000',
        overlayOpacity: 0,
        textBoxBorderRadius: 0,
        textBoxPadding: 20,
        textBoxWidth: 60,
        textBoxHeight: 30
      };
      break;
    case 'ribbon':
      updates = {
        textBoxWidth: 100,
        textBoxHeight: 25,
        textBoxBorderRadius: 0,
        overlayOpacity: 80,
        textBoxBackgroundColor: '#000000',
        textBoxPosition: { x: 50, y: 50 }
      };
      break;
    case 'pill':
    updates = { 
        textBoxWidth: 80,
        textBoxHeight: 35, 
        textBoxBorderRadius: 9999,
        overlayOpacity: 90, 
        textBoxPadding: 30,
        showQuoteMarks: true 
    };
    break;
  }
  updateDesignState(updates);
}

function recenterTextBox() {
  updateDesignState({ textBoxPosition: { x: 50, y: 50 } });
  const xRange = document.getElementById('textBoxXRange');
  const yRange = document.getElementById('textBoxYRange');
  if (xRange) xRange.value = 50;
  if (yRange) yRange.value = 50;
  document.getElementById('textBoxXDisplay').textContent = '50%';
  document.getElementById('textBoxYDisplay').textContent = '50%';
}

function shufflePalette() {
    if (!window.colorPalette || window.colorPalette.length < 2) return;

    for (let i = window.colorPalette.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        
        [window.colorPalette[i], window.colorPalette[j]] = [window.colorPalette[j], window.colorPalette[i]];
        
        [window.lockedColors[i], window.lockedColors[j]] = [window.lockedColors[j], window.lockedColors[i]];
    }

    renderColorPalette();
    if (currentDesignState.gradientMode === 'palette') {
        renderCanvas();
    }
}

function resetAllLocks() {
    window.lockedColors = [false, false, false, false, false];
    
    renderColorPalette();
}

// ==========================================
// 6. VIEW SWITCH & DOWNLOADS
// ==========================================

function switchView(viewName) {
        const designerView = document.getElementById('designerView');
        const galleryView = document.getElementById('galleryView');
        const previewArea = document.getElementById('previewArea');
        const galleryContent = document.getElementById('galleryContent');

        if (!designerView || !galleryView || !previewArea) return;

        if (viewName === 'gallery') {
            designerView.style.display = 'none';
            previewArea.style.setProperty('display', 'none', 'important');
            galleryView.style.display = 'flex';
            if (galleryContent) galleryContent.scrollTop = 0;
            
            renderGalleryView();
        } else {
            galleryView.style.display = 'none';
            designerView.style.display = 'flex';
            previewArea.style.setProperty('display', 'flex', 'important');
            renderCanvas();
        }
    }

async function handleDownload(format) {
  if (isDownloading) return;
  const canvasNode = document.getElementById('canvasExportTarget');
  if (!canvasNode || typeof window.htmlToImage === 'undefined') return;

  isDownloading = true;
  const btn = document.getElementById('downloadBtn'); 
  if (btn) btn.disabled = true;

  try {
    const options = {
      quality: 1.0,
      pixelRatio: 2,
      fontEmbedCSS: true,
      backgroundColor: currentDesignState.backgroundType === 'solid' ? currentDesignState.backgroundColor : '#000000'
    };
    const dataUrl =
      format === 'png' ? await window.htmlToImage.toPng(canvasNode, options) : await window.htmlToImage.toJpeg(canvasNode, options);
    const link = document.createElement('a');
    link.download = `vibrantPoster.${format}`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Download failed', error);
  } finally {
    isDownloading = false;
    if (btn) btn.disabled = false;
  }
}

// ==========================================
// 7. UTILITIES
// ==========================================

function getRgbaFromHex(hex, opacity) {
  if (!hex || hex.length < 7) return 'rgba(0, 0, 0, 0)';
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
}

function getRandomUniqueItems(arr, count) {
  if (!arr || arr.length === 0) return [];
  const capped = Math.min(count, arr.length);
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, capped);
}

function updateColorFromHex(targetId, value) {
  let normalizedValue = value.startsWith('#') ? value : `#${value}`;
  normalizedValue = normalizedValue.toUpperCase().slice(0, 7);

  const isPartialValid = /^#[0-9A-F]{1,6}$/.test(normalizedValue);
  if (!isPartialValid) return;

  const colorInput = document.getElementById(targetId);
  if (colorInput) {
    colorInput.value = normalizedValue;
    const colorBox = colorInput.parentElement?.querySelector('.colorBox') || null;
    if (colorBox) colorBox.style.backgroundColor = normalizedValue;

    const hexId = 'custom' + targetId.replace('Input', '').replace(/^./, c => c.toUpperCase()) + 'Hex';
    const hexInput = document.getElementById(hexId);
    if (hexInput) hexInput.value = normalizedValue;

    const isComplete = normalizedValue.length === 7 && /^#[0-9A-F]{6}$/.test(normalizedValue);
    if (isComplete) {
      colorInput.dispatchEvent(new Event('input'));
    }
  }
}

// ==========================================
// 8. RESET / NEW DESIGN
// ==========================================

function startNewDesign() {
  currentDesignState = getDefaultState();
  colorPalette = [];
  const backgroundLayer = document.getElementById('backgroundLayer');
  if (backgroundLayer) backgroundLayer.removeAttribute('style');
  renderCanvas();
  renderSidebarControls();
  console.log('Start New Design: Full reset complete.');
}

// ==========================================
// 9. IMAGE UPLOAD
// ==========================================

function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
        if (e.target?.result) {
            updateDesignState({
                backgroundImage: e.target.result,
                backgroundType: 'image',
                imageScale: 100, 
                imagePosition: { x: 50, y: 50 }
            });
        }
    };
    reader.readAsDataURL(file);
    event.target.value = ''; 
}

// ==========================================
// 10. FONTS (Favorites & Selection)
// ==========================================

function loadFavorites() {
  try {
    const savedFavorites = localStorage.getItem(FAVORITES_KEY);
    favoriteFonts = savedFavorites ? JSON.parse(savedFavorites) : ['Montserrat', 'Roboto'];
  } catch (e) {
    console.error('Error loading favorites from localStorage', e);
  }
}

function toggleFontFavorite(fontFamily) {
    const index = favoriteFonts.indexOf(fontFamily);
    if (index > -1) {
        favoriteFonts.splice(index, 1);
    } else {
        favoriteFonts.push(fontFamily);
    }
    saveFavorites();
    syncFavoriteToggle();
}

function saveFavorites() {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteFonts));
    renderSidebarControls();
  } catch (e) {
    console.error('Error saving favorites to localStorage', e);
  }
}

function handleFontSelect(fontFamily) {
  if (typeof VIBRANT_API?.loadFont === 'function') {
    VIBRANT_API.loadFont(fontFamily);
  }
  updateDesignState('fontFamily', fontFamily);
}

// ==========================================
// 11. QUOTES
// ==========================================
function selectQuote(quoteText, authorName) {
    const cleanQuote = quoteText.replace(/\\'/g, "'").replace(/\\"/g, '"');
    const cleanAuthor = authorName.replace(/\\'/g, "'").replace(/\\"/g, '"');
    updateDesignState({
        quoteText: cleanQuote,
        quoteAuthor: cleanAuthor
    });
}

function filterQuotes(searchTerm) {
  const term = searchTerm.toLowerCase().trim();
  const clearBtn = document.getElementById('clearQuoteSearch');
  const regenBtn = document.getElementById('regenSearch');

  const hasText = term !== '';
  if (clearBtn) clearBtn.style.display = hasText ? 'inline-block' : 'none';
  if (regenBtn) regenBtn.style.display = hasText ? 'inline-block' : 'none';

  if (!hasText) {
    quotes = getRandomUniqueItems(allQuotes, 3);
  } else {
    const safe = escapeRegex(term);
    const regex = new RegExp(`\\b${safe}\\b`, 'gi');
    const allMatches = allQuotes.filter(q => regex.test(q.quoteText) || regex.test(q.authorName));
    quotes = getRandomUniqueItems(allMatches, 3);
  }

  renderSidebarControls();
}

function clearQuoteFilter() {
  const filterInput = document.getElementById('quoteSearchFilter');
  if (filterInput) {
    filterInput.value = '';
    filterQuotes('');
  }
}

function regenerateFromSearch() {
  const term = document.getElementById('quoteSearchFilter').value.toLowerCase().trim();
  if (term !== '') filterQuotes(term);
}

function regenerateQuotes() {
  if (allQuotes.length === 0) {
    const currentTag = document.getElementById('quoteTagSelect')?.value || 'Inspiration';
    handleFetchQuotes(currentTag);
    return;
  }
  quotes = getRandomUniqueItems(allQuotes, 3);
  renderSidebarControls();
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightText(text, term) {
    if (!text) return []; 
    if (!term || term.trim() === '') {
        return [document.createTextNode(text)];
    }

    try {
        const safe = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(\\b${safe}\\b)`, 'gi');
        
        return text.split(regex).map(part => {
            if (part.toLowerCase() === term.toLowerCase()) {
                const mark = document.createElement('mark');
                mark.textContent = part;
                return mark;
            }
            return document.createTextNode(part);
        });
    } catch (e) {
        return [document.createTextNode(text)];
    }
}

async function handleFetchQuotes(tag) {
  if (typeof VIBRANT_API?.fetchQuotes !== 'function') {
    console.error('fetchQuotes not available.');
    return;
  }

  const fetchedQuotes = await VIBRANT_API.fetchQuotes(tag);
  allQuotes = fetchedQuotes;

  const filterInput = document.getElementById('quoteSearchFilter');
  const clearBtn = document.getElementById('clearQuoteSearch');
  const regenBtn = document.getElementById('regenSearch');
  if (filterInput) filterInput.value = '';
  if (clearBtn) clearBtn.style.display = 'none';
  if (regenBtn) regenBtn.style.display = 'none';

  quotes = getRandomUniqueItems(allQuotes, 3);
  renderSidebarControls();
}

// ==========================================
// 12. TABS
// ==========================================

function switchTab(tabId) {
  const allContent = document.querySelectorAll('.tabContent');
  allContent.forEach(content => {
    content.style.display = 'none';
    content.classList.remove('selected');
  });

  const allButtons = document.querySelectorAll('.tabButton');
  allButtons.forEach(btn => btn.classList.remove('selected'));

  const targetId = `tabContent${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`;
  const targetContent = document.getElementById(targetId);
  
  if (targetContent) {
    targetContent.style.display = 'block';
    targetContent.classList.add('selected');
  } else {
    console.error(`Tab content with ID ${targetId} not found.`);
  }

  const activeBtn = Array.from(allButtons).find(btn => 
    btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(tabId)
  );
  
  if (activeBtn) {
    activeBtn.classList.add('selected');
  }
}

// ==========================================
// 13. SHADOW PRESETS
// ==========================================

function applyShadowPreset(type) {
  let updates = {};

  if (type === 'glow') {
    updates = {
      textShadowOffsetX: 0,
      textShadowOffsetY: 0,
      textShadowBlur: 15,
      textShadowColor: currentDesignState.textColor
    };
  } else if (type === 'drop') {
    updates = {
      textShadowOffsetX: 4,
      textShadowOffsetY: 4,
      textShadowBlur: 4,
      textShadowColor: '#000000'
    };
  } else if (type === 'soft') {
    updates = {
      textShadowOffsetX: 2,
      textShadowOffsetY: 2,
      textShadowBlur: 10,
      textShadowColor: 'rgba(0,0,0,0.5)'
    };
  }

  updateDesignState(updates);
}

// ==========================================
// 14. EMOJIS
// ==========================================

async function handleEmojiSearch(query) {
    if (!query.trim()) return; 
    
    const grid = document.getElementById('emojiResultsGrid');
    if (grid) grid.innerHTML = '<p class="textCenter">Searching...</p>';

    try {
        const results = await VIBRANT_API.fetchEmojis(query);
        
        emojiSearchResults = results;

        renderEmojiSearchResults();
    } catch (error) {
        console.error("Handler error:", error);
        if (grid) grid.innerHTML = '<p class="textCenter">Search error. Try "face"!</p>';
    }
}

function renderEmojiSearchResults() {
  const grid = document.getElementById('emojiResultsGrid');
  if (!grid) return;

  grid.innerHTML = '';
    if (emojiSearchResults.length === 0) {
        grid.innerHTML = '<p class="textCenter">No results found.</p>';
        return;
    }

  emojiSearchResults.forEach(e => {
    const button = document.createElement('button');
    button.className = 'emojiResultBtn';
    button.textContent = e.character;
    button.title = e.slug;
    button.onclick = () => addEmojiToCanvas(e.character);
    grid.appendChild(button);
  });
}

function addEmojiToCanvas(character) {
  const newEmoji = {
    id: Date.now().toString(),
    char: character,
    x: 50,
    y: 50,
    size: 48,
    color: '#ffffff',
    rotation: 0
  };

  currentDesignState.emojis = [...currentDesignState.emojis, newEmoji];
  selectedEmojiId = newEmoji.id;
  updateDesignState('emojis', currentDesignState.emojis);
}

function handleEmojiPositionUpdate(axis, value, displayId) {
  const intValue = parseInt(value, 10);
  handleEmojiUpdate(axis, intValue);
  const display = document.getElementById(displayId);
  if (display) display.textContent = `${intValue}%`;
}

function handleEmojiUpdate(key, value) {
  if (!selectedEmojiId) return;
  const numericKeys = new Set(['size', 'rotation', 'x', 'y']);
  const parsedValue = numericKeys.has(key) ? Number(value) : value;
  const updatedEmojis = currentDesignState.emojis.map(e =>
    e.id === selectedEmojiId ? { ...e, [key]: parsedValue } : e
  );
  updateDesignState('emojis', updatedEmojis);
}

function removeSelectedEmoji() {
  if (!selectedEmojiId) return;
  const filteredEmojis = currentDesignState.emojis.filter(e => e.id !== selectedEmojiId);
  if (filteredEmojis.length > 0) {
    selectedEmojiId = filteredEmojis[filteredEmojis.length - 1].id;
  } else {
    selectedEmojiId = null;
  }
  updateDesignState('emojis', filteredEmojis);
}

function clearAllEmojis() {
    if (confirm("Are you sure you want to remove all emojis?")) {
        selectedEmojiId = null;
        updateDesignState('emojis', []);
    }
}

function selectEmojiLayer(id) {
    selectedEmojiId = id;
    renderSidebarControls(); 
    renderCanvas(); 
}

// ==========================================
// 15. IMAGE HELPERS
// ==========================================

function recenterImage() {
  updateDesignState({
    imagePosition: { x: 50, y: 50 }
  });

  const xRange = document.getElementById('imageXRange');
  const yRange = document.getElementById('imageYRange');
  if (xRange) xRange.value = 50;
  if (yRange) yRange.value = 50;

  const xDisplay = document.getElementById('imageXDisplay');
  const yDisplay = document.getElementById('imageYDisplay');
  if (xDisplay) xDisplay.textContent = '50%';
  if (yDisplay) yDisplay.textContent = '50%';
}

function snapImageToEdges() {
    updateDesignState({
        imageScale: 200, 
        imagePosition: { x: 50, y: 50 },
        imageBlur: 0
    });
    const scaleRange = document.getElementById('imageScaleRange');
    const scaleDisplay = document.getElementById('imageScaleDisplay');
    if (scaleRange) scaleRange.value = 200;
    if (scaleDisplay) scaleDisplay.textContent = '200';
}

function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    previousBackgroundState = {
        backgroundType: currentDesignState.backgroundType,
        backgroundColor: currentDesignState.backgroundColor,
        gradientStart: currentDesignState.gradientStart,
        gradientEnd: currentDesignState.gradientEnd,
        gradientDirection: currentDesignState.gradientDirection,
        gradientMode: currentDesignState.gradientMode
    };

    const reader = new FileReader();
    reader.onload = e => {
        if (e.target?.result) {
            updateDesignState({
                backgroundImage: e.target.result,
                backgroundType: 'image',
                imageScale: 100, 
                imagePosition: { x: 50, y: 50 }
            });
            document.getElementById('revertBgBtn').style.display = 'inline-block';
        }
    };
    reader.readAsDataURL(file);
    event.target.value = ''; 
}

function revertToPreviousBackground() {
    if (!previousBackgroundState) return;

    updateDesignState({
        ...previousBackgroundState,
        backgroundImage: null 
    });

    previousBackgroundState = null;
    document.getElementById('revertBgBtn').style.display = 'none';
}

// ==========================================
// 16. COLOR PALETTE
// ==========================================

async function handleFetchColorPalette() {
    const paletteDisplay = document.getElementById('paletteDisplay');
    if (paletteDisplay) paletteDisplay.innerHTML = '<p>Generating Palette...</p>';

    try {
        const newColors = await VIBRANT_API.fetchColorPalette();
        
        window.colorPalette = newColors;
        
        renderColorPalette();
        
    } catch (error) {
        console.error("Failed to generate palette:", error);
        if (paletteDisplay) paletteDisplay.innerHTML = '<p>Error generating colors.</p>';
    }
}

function handleColorSelect(hexColor, controlId = 'textColorInput') {
  const inputElement = document.getElementById(controlId);
  if (inputElement) {
    inputElement.value = hexColor;
    
    currentDesignState.textColor = hexColor;

    if (document.getElementById('paletteSection').style.display !== 'none') {
        currentDesignState.gradientMode = 'palette';
    }
    
    renderCanvas();
    renderSidebarControls();
  }
}

function setBackgroundType(type) {
  updateDesignState('backgroundType', type);
}

function applyPaletteAsGradient() {
    if (!window.colorPalette || window.colorPalette.length < 5) {
        alert("Generate a palette first!");
        return;
    }
    
    updateDesignState({
        backgroundType: 'gradient',
        gradientMode: 'palette',
        backgroundImage: null
    });
    
    renderCanvas();
}

function renderColorPalette() {
    const paletteDisplay = document.getElementById('paletteDisplay');
    if (!paletteDisplay) return;

    paletteDisplay.innerHTML = '';
    
    const locks = window.lockedColors || [false, false, false, false, false];

    window.colorPalette.forEach((hex, index) => {
        const chipWrapper = document.createElement('div');
        chipWrapper.className = 'colorChipWrapper';

        const chip = document.createElement('div');
        chip.className = 'colorChip';
        chip.style.backgroundColor = hex; 
        chip.title = `Click: Apply to Text\nDouble-Click: Copy Hex`;
        
        chip.onclick = () => handleColorSelect(hex);
        
        chip.ondblclick = () => copyToClipboard(hex);

        const lockBtn = document.createElement('button');
        lockBtn.className = `lockBtn ${locks[index] ? 'isLocked' : ''}`;
        lockBtn.innerHTML = locks[index] ? '🔒' : '🔓';
        lockBtn.onclick = (e) => {
            e.stopPropagation();
            window.lockedColors[index] = !window.lockedColors[index];
            renderColorPalette(); 
        };

        chipWrapper.appendChild(chip);
        chipWrapper.appendChild(lockBtn);
        paletteDisplay.appendChild(chipWrapper);
    });
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        
        const originalText = document.querySelector('.paletteContainer').nextElementSibling.textContent;
        const note = document.querySelector('.paletteContainer').nextElementSibling;
        
        note.textContent = `✅ Copied ${text} to clipboard!`;
        note.style.color = "#10b981";
        
        setTimeout(() => {
            note.textContent = originalText;
            note.style.color = ""; 
        }, 2000);
        
    } catch (err) {
        console.error('Failed to copy: ', err);
    }
}

function selectTwoColorMode() {
  document.getElementById('gradientColorControls').style.display = 'block';
  document.getElementById('paletteSection').style.display = 'none';

  document.getElementById('gradientModeTwoStop')?.classList.add('selected');
  document.getElementById('gradientModePalette')?.classList.remove('selected');
}

function selectPaletteMode() {
  document.getElementById('paletteSection').style.display = 'block';
  document.getElementById('gradientColorControls').style.display = 'none';

  document.getElementById('gradientModePalette')?.classList.add('selected');
  document.getElementById('gradientModeTwoStop')?.classList.remove('selected');
}

// ==========================================
// 17. GALLERY & LOCAL STORAGE
// ==========================================

function loadGalleryFromStorage() {
  try {
    const savedData = localStorage.getItem(GALLERY_KEY);
    return savedData ? JSON.parse(savedData) : [];
  } catch (e) {
    console.error('Error loading gallery from localStorage', e);
    return [];
  }
}

async function saveDesignToGallery() {
  const canvasNode = document.getElementById('canvasExportTarget');
  if (!canvasNode || typeof window.htmlToImage === 'undefined') {
    alert('Download library not ready.');
    return;
  }

  try {
    isDownloading = true;

    const options = {
      quality: 0.6,
      pixelRatio: 1.0,
      fontEmbedCSS: true,
      skipFonts: false,
      backgroundColor: currentDesignState.backgroundType === 'solid' ? currentDesignState.backgroundColor : '#000000',
      filter: node => {
        const exclusionClasses = ['tabButton', 'sidebar'];
        return !node.classList || !exclusionClasses.some(cls => node.classList.contains(cls));
      }
    };

    const dataUrl = await window.htmlToImage.toJpeg(canvasNode, options);

    const stateToSave = { ...currentDesignState, thumbnailUrl: dataUrl };
    if (!stateToSave.id) stateToSave.id = Date.now().toString();

    const gallery = loadGalleryFromStorage();
    const index = gallery.findIndex(design => design.id === stateToSave.id);

    if (index > -1) {
      gallery[index] = stateToSave;
    } else {
      gallery.push(stateToSave);
    }

    localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));
    alert('Design saved to gallery!');
  } catch (e) {
    console.warn('Gallery save failed with font rules, trying fallback...', e);
    const fallbackUrl = await window.htmlToImage.toJpeg(canvasNode, { quality: 0.5 });
    const stateToSave = { ...currentDesignState, thumbnailUrl: fallbackUrl, id: currentDesignState.id || Date.now().toString() };
    const gallery = loadGalleryFromStorage();
    gallery.push(stateToSave);
    localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));
  } finally {
    isDownloading = false;
  }
}

function deleteDesignFromGallery(idToDelete) {
  const gallery = loadGalleryFromStorage();
  const newGallery = gallery.filter(design => design.id !== idToDelete);

  try {
    localStorage.setItem(GALLERY_KEY, JSON.stringify(newGallery));
    if (document.getElementById('galleryView')?.style.display !== 'none') {
      renderGalleryView();
    }
    alert('Design deleted.');
  } catch (e) {
    console.error('Error deleting design', e);
  }
}

function clearFullGallery() {
    if (confirm("Are you sure you want to permanently delete ALL saved posters? This cannot be undone.")) {
        try {
            localStorage.setItem(GALLERY_KEY, JSON.stringify([]));
            renderGalleryView(); 
            alert('Gallery cleared.');
        } catch (e) {
            console.error('Error clearing gallery:', e);
        }
    }
}

function renderGalleryView() {
  const galleryContainer = document.getElementById('galleryContent');
  const gallery = loadGalleryFromStorage();
  const savedCount = gallery.length;

  const countElement = document.querySelector('.appHeader h1');
  if (countElement) countElement.textContent = `My Gallery (${savedCount} Saved Posters)`;

  if (!galleryContainer) return;

  galleryContainer.innerHTML = '';

  if (savedCount === 0) {
    galleryContainer.innerHTML = '<p class="text-center py-10 text-gray-400">Your gallery is empty. Save a design to begin!</p>';
    return;
  }

  gallery.forEach(design => {
    const savedAspect = design.aspectRatio || '1:1';
    const [aspectW, aspectH] = savedAspect.split(':').map(Number);
    const thumbWidth = 300;
    const thumbHeight = thumbWidth * (aspectH / aspectW);

    const card = document.createElement('div');
    card.className = 'galleryCard';

    const saveTimestamp = parseInt(design.id, 10);
    const saveDate = Number.isNaN(saveTimestamp) ? '' : new Date(saveTimestamp).toLocaleDateString('en-US');

    card.innerHTML = `
      <div class="galleryPreviewArea" style="background: ${design.backgroundColor};">
        <img class="thumbnailImage"
          src="${design.thumbnailUrl || ''}"
          alt="Saved Poster Design Preview"
          width="${thumbWidth}"
          height="${thumbHeight}"
        />
        <div class="cardActions">
          <button class="editBtn" onclick="loadDesignForEdit('${design.id}')">
            <span class="icon">✏️</span>
          </button>
          <button class="deleteBtn" onclick="deleteDesignFromGallery('${design.id}')">
            <span class="icon">🗑️</span>
          </button>
        </div>
      </div>
      <div class="cardFooter">
        <span class="date">📅 ${saveDate}</span>
      </div>
    `;
    galleryContainer.appendChild(card);
  });
}

function loadDesignForEdit(id) {
  const gallery = loadGalleryFromStorage();
  const designToLoad = gallery.find(design => design.id === id);
  if (!designToLoad) {
    console.error('Design not found for ID:', id);
    return;
  }

  currentDesignState = { ...designToLoad };
  selectedEmojiId = null;
  updateDesignState('id', null); // ensure new save creates a new entry

  switchView('design');
  if (typeof VIBRANT_API?.loadFont === 'function') {
    VIBRANT_API.loadFont(designToLoad.fontFamily);
  }
}

// ==========================================
// 18. FAVORITE TOGGLE SYNC
// ==========================================

function syncFavoriteToggle() {
    const favoriteToggleBtn = document.querySelector('.favoriteToggleBtn');
    if (favoriteToggleBtn && currentDesignState.fontFamily) {
        const isFavorite = favoriteFonts.includes(currentDesignState.fontFamily);
        favoriteToggleBtn.textContent = isFavorite ? '★' : '☆';
        favoriteToggleBtn.title = isFavorite 
            ? `Remove ${currentDesignState.fontFamily} from favorites` 
            : `Add ${currentDesignState.fontFamily} to favorites`;
    }
}

// ==========================================
// 19. INITIALIZER
// ==========================================

async function initApp() {
    loadFavorites();
    
    window.lockedColors = window.lockedColors || [false, false, false, false, false];
    window.colorPalette = window.colorPalette || ["#0F172A", "#1E293B", "#6366F1", "#A78BFA", "#F8FAFC"];

    if (typeof VIBRANT_API?.loadFont === 'function') {
        VIBRANT_API.loadFont(currentDesignState.fontFamily);
    }
    
    renderCanvas();
    renderSidebarControls();
    switchTab('aspectRatio');
    
    if (typeof VIBRANT_API?.fetchGoogleFonts === 'function') {
        availableFonts = VIBRANT_API.fetchGoogleFonts();
    }
    
    handleFetchQuotes('Inspiration');
    
    window.colorPalette = await VIBRANT_API.fetchColorPalette();
    renderColorPalette();
    
    setTimeout(() => {
        renderCanvas();
    }, 150); 
}

// ==========================================
// 20. GLOBAL EXPORTS
// ==========================================

window.recenterTextBox = recenterTextBox;
window.recenterImage = recenterImage;
window.handleRangeUpdate = handleRangeUpdate;
window.handlePositionUpdate = handlePositionUpdate;
window.handleImageUpload = handleImageUpload;
window.handleFontSelect = handleFontSelect;
window.selectQuote = selectQuote;
window.setTextMode = setTextMode;
window.resetBoxToDefaults = resetBoxToDefaults;
window.shufflePalette = shufflePalette;
window.resetAllLocks = resetAllLocks;
window.copyToClipboard = copyToClipboard;
window.clearQuoteFilter = clearQuoteFilter;
window.applyShadowPreset = applyShadowPreset;
window.applyBoxPreset = applyBoxPreset;
window.handleEmojiSearch = handleEmojiSearch;
window.addEmojiToCanvas = addEmojiToCanvas;
window.handleEmojiUpdate = handleEmojiUpdate;
window.removeSelectedEmoji = removeSelectedEmoji;
window.clearAllEmojis = clearAllEmojis;
window.selectEmojiLayer = selectEmojiLayer;
window.handleEmojiPositionUpdate = handleEmojiPositionUpdate;
window.handleFetchQuotes = handleFetchQuotes;
window.regenerateQuotes = regenerateQuotes;
window.updateColorFromHex = updateColorFromHex;
window.resetAllLocks = resetAllLocks;
window.handleDownload = handleDownload;
window.updateColorFromHex = updateColorFromHex;
window.handleFetchColorPalette = handleFetchColorPalette;
window.handleColorSelect = handleColorSelect;
window.applyPaletteAsGradient = applyPaletteAsGradient;
window.switchView = switchView;
window.loadDesignForEdit = loadDesignForEdit;
window.deleteDesignFromGallery = deleteDesignFromGallery;
window.saveDesignToGallery = saveDesignToGallery;
window.clearFullGallery = clearFullGallery;
window.switchTab = switchTab;
window.updateDesignState = updateDesignState;
window.snapImageToEdges = snapImageToEdges;
window.revertToPreviousBackground = revertToPreviousBackground;
window.toggleFontFavorite = toggleFontFavorite;
window.startNewDesign = startNewDesign;
window.selectTwoColorMode = selectTwoColorMode;
window.selectPaletteMode = selectPaletteMode;
window.previewBackgroundMode = previewBackgroundMode;
window.applyTwoColorGradient = applyTwoColorGradient;
window.regenerateFromSearch = regenerateFromSearch;
window.renderSidebarControls = renderSidebarControls;
window.renderColorPalette = renderColorPalette;

window.addEventListener('resize', () => {
    renderCanvas();
});
document.addEventListener('DOMContentLoaded', initApp);