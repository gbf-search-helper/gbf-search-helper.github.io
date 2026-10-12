function supports(boss){return {ja:!boss||Boolean(boss.jp),en:!boss||Boolean(boss.en)};}
export const groups = [
  {id:'element', label:'편성 속성', values:[['fire','화','火属性','Fire'],['water','수','水属性','Water'],['earth','토','土属性','Earth'],['wind','풍','風属性','Wind'],['light','광','光属性','Light'],['dark','암','闇属性','Dark']]},
  {id:'difficulty',label:'고전장 난이도', eventOnly:true, values:[['explus','EX+','EX+','EX+'],['swarm','SWARM','SWARM','SWARM'],...['90','95','100','150','200','250'].map(x=>[x,x+'HELL',x+'HELL',x+'HELL'])]},
  {id:'mode',label:'조작 방식',values:[['full','풀오토','フルオート','full auto'],['manual','수동','手動','manual']]},
  {id:'party',label:'참여 방식',values:[['solo','솔로','ソロ','solo'],['help','구원','救援','raid help'],['blue','청상','青箱','blue chest']]},
  {id:'buttons',label:'버튼 수',values:[['0','0버튼','0ポチ','0 buttons'],['1','1버튼','1ポチ','1 button'],['2','2버튼','2ポチ','2 buttons']]},
  {id:'summons',label:'소환 수',values:[['0','0소환','召喚なし','no summons'],['1','1소환','1召喚','1 summon']]},
  {id:'build',label:'편성 계열',values:[['magna','마그나','マグナ','Magna'],['primal','신석','神石','Primal']]},
  {id:'ougi',label:'오의 사용',values:[['focused','오의축','奥義軸','ougi team'],['off','오의 끄기','奥義オフ','ougi off']]},
  {id:'restriction',label:'캐릭터 조건',values:[['no-seasonal','시즌 한정 없음','季節限定なし','no seasonal characters']]},
  {id:'purpose',label:'찾을 정보',values:[['setup','편성','編成','team'],['guide','공략','攻略','guide'],['farm','주회','周回','farming']]},
  {id:'turns',label:'턴 수',values:[['one','1턴','1ターン','1 turn'],['two','2턴','2ターン','2 turns'],['three','3턴','3ターン','3 turns']]},
  {id:'priority',label:'안정성',values:[['stable','안정','安定','stable']]},
  {id:'experience',label:'대상 사용자',values:[['beginner','초보자용','初心者','beginner']]}
].map(group=>({...group,multiple:!['element','mode','party','buttons','summons','turns'].includes(group.id)}));
export function buildQuery(boss, selection, prefix=true) {
  const tokens = prefix ? ['グラブル'] : [];
  const englishTokens = prefix ? ['GBF'] : [];
  const eventElement=boss?.category==='event'?groups.find(g=>g.id==='element').values.find(v=>v[0]===selection.element):null;
  if(boss){tokens.push(eventElement?eventElement[2].replace('属性','')+boss.jp:boss.jp);englishTokens.push(eventElement?eventElement[3]+' '+boss.en:boss.en);}
  const labels=boss?[eventElement?eventElement[1]+'고전장':boss.ko]:[];
  for (const group of groups) {
    if (group.eventOnly && boss?.category !== 'event') continue;
    const selected=Array.isArray(selection[group.id])?selection[group.id]:[selection[group.id]];
    for(const value of group.values.filter(v=>selected.includes(v[0]))){
    // 고전장 카드가 이미 속성을 포함하므로 같은 속성은 중복하지 않는다.
    if (group.id==='element' && (boss?.category==='event'||boss?.element===value[0])) continue;
    tokens.push(value[2]);englishTokens.push(value[3]);
    labels.push(value[1]);
    }
  }
  return {query:tokens.filter(Boolean).join(' '), englishQuery:englishTokens.filter(Boolean).join(' '), summary:labels.join(' · '),available:supports(boss)};
}
export function searchLinks(query) {
  const q=encodeURIComponent(query);
  return {youtube:`https://www.youtube.com/results?search_query=${q}`,google:`https://www.google.com/search?q=${q}`,x:`https://x.com/search?q=${q}&f=live`};
}
