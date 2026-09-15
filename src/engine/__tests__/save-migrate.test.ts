import { describe, it, expect } from 'vitest';
import { migrate } from '../../store/gameStore';

describe('存档迁移：ended 档（结局后续玩路径）', () => {
  it('migrate 不抛错且 phase 保持 ended', () => {
    const saved = JSON.parse(`{
      "sessionId":"cont","rngSeed":555,"day":30,"daysLimit":30,"phase":"ended","endingId":"end_broke",
      "dayPhase":"morning","playerName":"小满","motive":"debt","personaId":"wise_sister",
      "money":200,"goal":1500,"energy":8,"energyMax":16,"numbness":22,"conscience":44,"riskLevel":8,
      "targets":[{"targetId":"lao_li","trust":46,"wariness":22,"stage":"warming","daysSilent":0,"pendingChain":"","totalReceived":800,"timesPaid":2,"daysSincePaid":1,"lastChatDay":0,"discoveredDay":1,"pingedToday":false,"recentPacks":[],"recentGreetingIdx":-1,"recentPhotoIdx":-1,"blocked":false,"ended":null}],
      "chat":null,"log":[],"usedOneTimeEvents":[],
      "stats":{"totalEarned":300,"redPacketsReceived":3,"asksMade":1,"asksFailed":0,"nightsWorked":2,"biggestPacket":120},
      "flags":{},"industryCourse":false,
      "profile":{"avatarId":1,"ageClaim":24,"traitId":"sweet_mouth","selfieId":"bestie","selfieDay":2,"bioId":"hardup_plaintext"},
      "ledger":[],"archives":[],"incoming":[],"todayPlan":"","numbnessToday":0,"moments":[],"unseenMoments":0,
      "inventory":{},"briefingDay":30,"pendingBeat":"","beatResolved":false,"pinnedTargets":[],"pendingIncident":"","incidentResolved":false,
      "selfieAudience":[],"bioAudience":[],"bioAudienceDay":0,
      "comfort":{"active":true,"family":74,"love":88,"minutes":30,"blockedByBf":false,"bfState":"normal","datesMet":{"wu":8,"chen":10}}
    }`);
    let m: ReturnType<typeof migrate> | null = null;
    expect(() => { m = migrate(saved); }).not.toThrow();
    expect(m!.phase).toBe('ended');
    expect(m!.endingId).toBe('end_broke');
    expect(m!.day).toBe(30);
  });
});
