const rvApiKey = 'TWOJ KLUCZ API DO RESPONSIVE VOICE';
window.rvApiKey = rvApiKey;
const apiHost = 'https://api.posten.best/blind';

const dict = {
  beforeEnd: 'beforeEnd',
  script: 'script',
  src: 'src',
  template: 'template',
  emptyString: '',
  coolEmoji: `src="/emotki/cool.gif"`,
  hiEmoji: `src="/emotki/lapka.gif"`,
  dataRvKey: 'data-rv',
  $postInfo: '.postInfo',
  $postMessage: '.postMessage',
  male: 'male',
  $dataRv: 'a[data-rv]',
  click: 'click',
  load: 'load',
  $thread: '.thread',
  scroll: 'scroll',
  br: '<br>',
  voice: {
    male: 'Polish Male',
    female: 'Polish Female',
  },
  translation: {
    cool: 'kul',
    hi: 'cześć',
    image: 'obrazek',
    opKey: 'OP',
    toOp: 'opa',
    toPost: 'do posta',
    toWebsite: 'link do strony',
  },

};

const HTMLRegexp = new RegExp(`\\<(.*?)\\>(.*?)<\\/(.*?)>|<(.*?)\\/>`, 'g');
const spoilerRegexp = new RegExp('\<s\>(.*?)<\/s>', 'g');
const spoilerContentRegexp = new RegExp('(?<=\<s\>)(.*?)(?=<\/s>)', 'g');

const quoteLinkRegexp = new RegExp(`(\\<a(.*?)quotelink(.*?)\\>)(.*?)(<\\/a>)`, 'g');
const quoteLinkContent = new RegExp(`(?<=\\<a(.*?)quotelink(.*?)\\>)(.*?)(?=<\\/a>)`, 'g');

const quoteRegexp = new RegExp(`(\\<span(.*?)quote(.*?)\\>)(.*?)(<\\/span>)`, 'g');
const quoteRegexpContent = new RegExp(`(?<=\\<span(.*?)quote(.*?)\\>)(.*?)(?=<\\/span>)`, 'g');

const postLinkRegexp = new RegExp(`(\\<a(.*?)postlink(.*?)\\>)(.*?)(<\\/a>)`, 'g');
const postLinkContent = new RegExp(`(?<=\\<a(.*?)postlink(.*?)\\>)(.*?)(?=<\\/a>)`, 'g');

const imgContentRegexp = new RegExp(`(?<=\\<img(.*?)(.*?)\\>)(.*?)(?=<\\/img>)`, 'g');
const imgRegexp = new RegExp(`(\\<img(.*?)(.*?)\\>)(.*?)(<\\/img>)`, 'g');

const arrowRightRegexp = new RegExp(`&gt;`, 'g');
const backLink = new RegExp(`(\\<div(.*?)backlink(.*?)\\>)(.*?)(<\\/div>)`, 'g');

const postRegexp = new RegExp(/\bpost\b/);
const rvGuiHtml = `
  <span>
    <a href="#" data-rv="male">[Czytaj męskim głosem]</a>
    <a href="#" data-rv="female">[Czytaj damskim głosem]</a>
  </span>
`;

const appendHTML = (el, html) => el.insertAdjacentHTML(dict.beforeEnd, html);

const rv_script = document.createElement(dict.script);
rv_script.setAttribute(dict.src, apiHost);
document.head.appendChild(rv_script);

const HTMLParse = text => {
  const html = document.createElement(dict.template);
  html.innerHTML = text;
  return html.content;
};

const replaceMany = (text, substrings, newSubstrings) => {
  const replaceIndex = (substr, idx) => {
    const replacedText = text.replace(substr, newSubstrings[idx]);

    text = replacedText;
  };

  substrings.forEach(replaceIndex);
  return text;
};

const removeMatched = (text, regexp, replaceRegexp) => {
  const matched = text.match(regexp);
  if (!matched) return { replacedText: text, isChanged: false, replaceContent: [] };

  const replaceContent = text.match(replaceRegexp);
  const replacedText = replaceMany(text, matched, replaceContent);
  const isChanged = text !== replacedText;

  return { replacedText, isChanged, replaceContent };
};

const getAdvancedText = (text, regexp, replaceRegexp, onNotChangedCallback, getDataCallback, onChangedCallback) => {
  const { isChanged, replacedText, replaceContent } = removeMatched(text, regexp, replaceRegexp);
  if (!isChanged) return onNotChangedCallback(text);

  let advancedText = replacedText;

  replaceContent.forEach(content => {
    const properContent = getDataCallback(content, advancedText);
    advancedText = advancedText.replace(content, properContent);
  });

  return onChangedCallback(advancedText);
};

const getToPosterText2 = (text) => {
  const onNotChangedCallback = (text) => text;
  const getDataCallback = (text) => {
    const poster = text.replace(arrowRightRegexp, dict.emptyString);
    return poster.indexOf(dict.translation.opKey) === -1 ? poster : dict.translation.toOp;
  };
  const onChangedCallback = (text) => `${dict.translation.toPost} ${text}`;

  return getAdvancedText(text, quoteLinkRegexp, quoteLinkContent, onNotChangedCallback, getDataCallback, onChangedCallback);
};

const getLinkText2 = (text) => {
  const onNotChangedCallback = (text) => text;
  const getDataCallback = (text) => new URL(text).host;
  const onChangedCallback = (text) => `${dict.translation.toWebsite} ${text}`;

  return getAdvancedText(text, postLinkRegexp, postLinkContent, onNotChangedCallback, getDataCallback, onChangedCallback);
};

const getImgDesc = (text) => {
  if (text.includes(dict.coolEmoji)) {
    return dict.translation.cool;
  }

  if (text.includes(dict.hiEmoji)) {
    return dict.translation.hi;
  }

  return dict.translation.image;
};

const getImg2 = (text) => {
  const onNotChangedCallback = (text) => text;
  const getDataCallback = (text) => getImgDesc(text);
  const onChangedCallback = (text) => text;

  return getAdvancedText(text, imgRegexp, imgContentRegexp, onNotChangedCallback, getDataCallback, onChangedCallback);
};


const getQuote2 = (text) => {
  const onNotChangedCallback = (text) => ({ line: text });
  const getDataCallback = (text) => text.replace(arrowRightRegexp, dict.emptyString);
  const onChangedCallback = (text) => ({ line: text, pitch: 1.5 });

  return getAdvancedText(text, quoteRegexp, quoteRegexpContent, onNotChangedCallback, getDataCallback, onChangedCallback);
};

const rvGetLineInfo = line => {
  let pitch;
  const isHTMLString = line.match(HTMLRegexp);
  if (!isHTMLString) return { line };

  //remove back links
  line = line.replace(backLink, dict.emptyString);

  // without spoilers
  ({ replacedText: line } = removeMatched(line, spoilerRegexp, spoilerContentRegexp));
  line = getToPosterText2(line);
  line = getLinkText2(line);
  line = getImg2(line);
  ({ line, pitch } = getQuote2(line));

  line = line.replace(/<(?:.|\n)*?>/gm, dict.emptyString);

  return { line, pitch };

};

const rvSpeak = (lines, voice) => {
  const firstLine = lines[0];
  const { line, pitch = 1 } = rvGetLineInfo(firstLine);
  if (!line) return;

  const params = {
    onend: () => rvSpeak(lines.slice(1), voice),
    pitch,
  };

  window.responsiveVoice.speak(line, voice, params);
};

const rvPrepare = (textToRead, voice) => {
  if (!textToRead.trim()) return;

  const lines = textToRead.split(dict.br);
  const existLines = lines.filter(line => line);

  rvSpeak(existLines, voice);
};

const call = () => {
  const lastCall = (() => {
    let lastCall = null;

    return {
      set: (v) => lastCall = v,
      get: () => lastCall,
    };
  })();


  const isOk = () => {
    const last = lastCall.get();
    if (last === null) {
      lastCall.set(Date.now());
      return true;
    }

    lastCall.set(Date.now());
    return Date.now() - last > 100;
  };

  return {
    isOk,
  };
};
const readBtnCall = call();

const rvAddReadBtns = () => {
  const isOk = readBtnCall.isOk();
  if (!isOk) return;
  const postInfos = [...document.querySelectorAll(dict.$postInfo)];
  postInfos.forEach(postInfo => {
    const isGui = postInfo.querySelector(dict.$dataRv);
    if (isGui) return;

    appendHTML(postInfo, rvGuiHtml);
  });
};

const rvInit = () => {

  document.body.addEventListener(dict.click, e => {
    const { target } = e;
    const selectedVoice = target.getAttribute(dict.dataRvKey);

    if (!target instanceof HTMLAnchorElement || !selectedVoice) {
      return;
    }
    e.preventDefault();

    const post = e.path.find(path => {
      return postRegexp.test(path.classList.toString());
    });

    const postMessage = post.querySelector(dict.$postMessage);
    const rvContent = postMessage.innerHTML;
    const rvVoice = selectedVoice === dict.male ? dict.voice.male : dict.voice.female;

    rvPrepare(rvContent, rvVoice);
  });

  const callback = () => rvAddReadBtns();
  const observer = new MutationObserver(callback);

  observer.observe(document.querySelector(dict.$thread), { childList: true });


  rvAddReadBtns();
  window.addEventListener(dict.scroll, rvAddReadBtns);
};

window.addEventListener(dict.load, rvInit, false);
