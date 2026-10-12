import { groups, buildQuery, searchLinks } from './query.mjs?v=0.3.5';
import { categories as defaultCategories, bosses as defaultBosses } from './catalog.mjs?v=0.3.5';
const categories=defaultCategories;
const bosses=defaultBosses;
const STATE_KEY='gbf-search-web-state-v1';
async function readState(){try{return JSON.parse(localStorage.getItem(STATE_KEY)||'{}')||{};}catch{return {};}}
async function writeValue(key,value){localStorage.setItem(key,JSON.stringify(value));}
const $=id=>document.getElementById(id);
let saved=await readState();
let boss=saved.boss===null?null:(bosses.find(b=>b.id===(saved.boss?.startsWith('gw-')?'gw':saved.boss))||(saved.boss?.startsWith('custom-')?null:bosses.find(b=>b.id==='subaha')));
let category=boss?.category||null;
let pickerMode='groups';
let selection={};
let language=saved.language==='en'?'en':'ja';
let currentResult;
for(const group of groups){
  const prior=saved.selection?.[group.id];
  const valid=group.values.filter(v=>(Array.isArray(prior)?prior:[prior]).includes(v[0])).map(v=>v[0]);
  if(valid.length)selection[group.id]=group.multiple?valid:valid[0];
}
if(saved.boss?.startsWith('gw-')&&!selection.element)selection.element=saved.boss.slice(3);
if(boss?.element) selection.element=boss.element;
$('prefix').checked=saved.prefix!==false;

function save(){writeValue(STATE_KEY,{boss:boss?.id??null,selection,prefix:$('prefix').checked,language}).catch(()=>{$('status').textContent='선택 내용을 저장하지 못했습니다.';});}
function renderCategories(){
  $('categories').replaceChildren();
  for(const item of categories){
    const btn=document.createElement('button');btn.type='button';btn.className='category-card';btn.dataset.category=item.id;btn.setAttribute('aria-pressed',String(category===item.id));
    if(item.image){
      const art=document.createElement('div');art.className='category-art';
      const img=document.createElement('img');img.src=item.image;img.alt='';art.append(img);
      if(item.id==='versusia'){
        const title=document.createElement('div');title.className='versusia-title';title.setAttribute('aria-hidden','true');
        for(const word of ['Versusia','Genesis']){const line=document.createElement('span');line.textContent=word;title.append(line);}
        art.append(title);
      }
      if(item.stars){
        const badge=document.createElement('div');badge.className='category-stars'+(item.stars>5?' small-stars':'');badge.setAttribute('aria-hidden','true');
        for(let i=0;i<item.stars;i++){
          const star=document.createElement('i');star.className='raid-star';
          if(item.stars>5){star.style.left=(39+(i%5)*7.5)+'px';star.style.top=(i<5?-5:4)+'px';star.style.zIndex=String(9-i);}
          else{star.style.right=(1+i*9)+'px';}
          badge.append(star);
        }
        art.append(badge);btn.setAttribute('aria-label',item.ko+' · 별 '+item.stars+'개');
      }
      btn.append(art);
    }else{const art=document.createElement('div');art.className='event-art';art.textContent='古戦場';btn.append(art);}
    const available=bosses.some(b=>b.category===item.id);
    btn.title=item.ko+(item.stars?' · 별 '+item.stars+'개':'');
    if(!btn.hasAttribute('aria-label'))btn.setAttribute('aria-label',item.ko);
    btn.disabled=!available;
    btn.addEventListener('click',()=>{
      category=item.id;
      if(['versusia','event'].includes(item.id)){
        pickerMode='groups';
        if(boss?.category===item.id){boss=null;category=null;renderCategories();renderBosses();renderOptions();update();}
        else selectBoss(bosses.find(b=>b.category===item.id));
      }
      else{pickerMode='bosses';renderCategories();renderBosses();}
      renderPicker();
    });$('categories').append(btn);
  }
}
function renderBosses(){
  $('bosses').replaceChildren();
  for(const item of bosses.filter(b=>b.category===category)){
    const btn=document.createElement('button');btn.type='button';btn.className='boss-choice';btn.setAttribute('aria-pressed',String(boss?.id===item.id));
    if(item.image){const image=document.createElement('img');image.src=item.image;image.alt='';image.width=64;image.height=64;btn.append(image);}else{const fallback=document.createElement('span');fallback.className='boss-image-fallback';fallback.textContent=item.element?({fire:'火',water:'水',earth:'土',wind:'風',light:'光',dark:'闇'}[item.element]):'◆';btn.append(fallback);}
    btn.setAttribute('aria-label',item.ko);btn.title=item.ko+' · '+(item.jp||item.en);
    btn.disabled=false;
    if(btn.disabled)btn.title+=' · 선택한 조건과 지원 언어가 다릅니다.';
    btn.addEventListener('click',()=>{
      if(boss?.id===item.id){boss=null;renderCategories();renderBosses();renderOptions();update();}
      else selectBoss(item);
    });$('bosses').append(btn);
  }
  if(!$('bosses').childElementCount){const note=document.createElement('p');note.className='hint';note.textContent='등록된 보스가 없습니다.';$('bosses').append(note);}
}
function selectBoss(item){boss=item;delete selection.difficulty;if(item.element)selection.element=item.element;renderCategories();renderBosses();renderOptions();update();}
function renderPicker(){
  const isGroups=pickerMode==='groups';$('categories').hidden=!isGroups;$('bosses').hidden=isGroups;$('back-groups').hidden=isGroups;
  $('picker-title').parentElement.hidden=isGroups;
  $('picker-hint').hidden=isGroups;
}
function renderOptions(){
  $('options').replaceChildren();
  const common=document.createElement('div');common.className='common-options chips';common.setAttribute('role','group');common.setAttribute('aria-label','공통 검색 조건');
  for(const group of groups){
    if(group.eventOnly&&boss?.category!=='event')continue;
    if(group.id==='element'&&boss?.element)continue;
    const section=document.createElement('div');section.className='option-group';section.dataset.option=group.id;
    if(!group.multiple){const heading=document.createElement('h3');heading.textContent=group.label;section.append(heading);}
    const chips=document.createElement('div');chips.className='chips';chips.setAttribute('role','group');chips.setAttribute('aria-label',group.label);
    for(const [value,label] of group.values){
      const button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.group=group.id;button.dataset.value=value;if(group.id==='party'&&value==='blue')button.title='청상 (블루체스트) · 青箱 · blue chest';
      if(group.id==='element'){
        button.classList.add('element-button');button.title=label+'속성';button.setAttribute('aria-label',label+'속성');button.textContent='';
        const icon=document.createElement('span');icon.className='element-icon';icon.setAttribute('aria-hidden','true');
        icon.classList.add('element-'+value);button.append(icon);
      }
      const locked=group.id==='element'&&Boolean(boss?.element);button.disabled=locked;
      const selected=group.multiple?(selection[group.id]||[]).includes(value):selection[group.id]===value;
      button.setAttribute('aria-pressed',String(selected));
      button.addEventListener('click',()=>{
        if(group.multiple){
          const values=selection[group.id]||[];
          const next=values.includes(value)?values.filter(v=>v!==value):[...values,value];
          if(next.length)selection[group.id]=next;else delete selection[group.id];
        }else if(selection[group.id]===value)delete selection[group.id];else selection[group.id]=value;
        renderOptions();update();
      });chips.append(button);
    }
    if(group.multiple){common.append(...chips.children);}
    else{section.append(chips);$('options').append(section);}
  }
  $('options').append(common);

}

function update(){
  const result=buildQuery(boss,selection,$('prefix').checked);
  currentResult=result;
  if(!result.available[language]&&(result.available.ja||result.available.en))language=result.available.ja?'ja':'en';
  const valid=result.available.ja||result.available.en;
  const query=language==='en'?result.englishQuery:result.query;
  $('query').textContent=valid?query:'선택한 항목의 지원 언어가 다릅니다.';$('query').lang=language;$('summary').textContent=result.summary;$('query').title=valid?query:'';$('summary').title=result.summary;
  for(const code of ['ja','en']){$('language-'+code).setAttribute('aria-pressed',String(language===code&&valid));$('language-'+code).disabled=!result.available[code];}
  $('copy').disabled=!result.available.ja;$('copy-en').disabled=!result.available.en;
  const links=searchLinks(query);for(const name of ['youtube','google','x']){$(name).href=links[name];$(name).setAttribute('aria-disabled',String(!valid));$(name).tabIndex=valid?0:-1;}
  $('status').textContent=valid?'선택한 버튼을 다시 누르면 해당 조건이 해제됩니다.':'지원 언어가 다른 커스텀 조건을 해제하세요.';save();
}
$('prefix').addEventListener('change',update);
$('reset').addEventListener('click',()=>{selection=boss?.element?{element:boss.element}:{};$('prefix').checked=true;renderOptions();update();$('status').textContent='검색 조건을 초기화했습니다.';});
for(const code of ['ja','en'])$('language-'+code).addEventListener('click',()=>{language=code;update();});
async function copyQuery(code){
  if(!currentResult.available[code])return;
  const query=code==='en'?currentResult.englishQuery:currentResult.query;
  try{await navigator.clipboard.writeText(query);$('status').textContent=(code==='en'?'영문':'일본어')+' 검색어를 복사했습니다.';}
  catch{language=code;update();const range=document.createRange();range.selectNodeContents($('query'));const selected=window.getSelection();selected.removeAllRanges();selected.addRange(range);$('status').textContent='검색어가 선택되었습니다. Ctrl+C로 복사하세요.';}
}
$('copy').addEventListener('click',()=>copyQuery('ja'));
$('copy-en').addEventListener('click',()=>copyQuery('en'));
$('back-groups').addEventListener('click',()=>{pickerMode='groups';renderCategories();renderPicker();});
renderCategories();renderBosses();renderOptions();renderPicker();update();
