// All 8 Sauin Studio Commissions totaling 300 Oroberyl and 40,000 T-Creds
// (docs/DESIGN.md §6.3).

import { TOTAL_ENDINGS, TOTAL_TAKES } from './constants.js';

export const COMMISSIONS = Object.freeze([
  Object.freeze({
    id: 'comm_act1',
    commissionId: 'comm_act1',
    order: 1,
    title: 'Quiet on Set!',
    shortTitle: 'Quiet on Set!',
    description: 'Complete Act 1 and record any Act 1 Take.',
    shortDescription: 'Complete Act 1.',
    oroberyl: 40,
    tCreds: 5000,
    kind: 'act1_complete',
    target: 1,
  }),
  Object.freeze({
    id: 'comm_first_wrap',
    commissionId: 'comm_first_wrap',
    order: 2,
    title: "That's a Wrap!",
    shortTitle: "That's a Wrap!",
    description: 'Complete all 5 Acts and unlock any Sauin Ending.',
    shortDescription: 'Complete all 5 Acts (any Ending).',
    oroberyl: 60,
    tCreds: 5000,
    kind: 'any_ending',
    target: 1,
  }),
  Object.freeze({
    id: 'comm_end2',
    commissionId: 'comm_end2',
    order: 3,
    title: 'Heart of the Myriad',
    shortTitle: 'Heart of the Myriad',
    description: 'Unlock //END2: The Sauin Universe (Love >= 6).',
    shortDescription: 'Unlock //END2 (Love >= 6).',
    oroberyl: 40,
    tCreds: 5000,
    kind: 'ending',
    requiredEndingId: 'END2',
    target: 1,
  }),
  Object.freeze({
    id: 'comm_end3',
    commissionId: 'comm_end3',
    order: 4,
    title: 'Carnival Director',
    shortTitle: 'Carnival Director',
    description: 'Unlock //END3: An Unending Parade (Joy >= 6).',
    shortDescription: 'Unlock //END3 (Joy >= 6).',
    oroberyl: 40,
    tCreds: 5000,
    kind: 'ending',
    requiredEndingId: 'END3',
    target: 1,
  }),
  Object.freeze({
    id: 'comm_end4',
    commissionId: 'comm_end4',
    order: 5,
    title: 'Myth of Talos',
    shortTitle: 'Myth of Talos',
    description: 'Unlock //END4: Sauin & Sarkaz (Wonder >= 6).',
    shortDescription: 'Unlock //END4 (Wonder >= 6).',
    oroberyl: 40,
    tCreds: 5000,
    kind: 'ending',
    requiredEndingId: 'END4',
    target: 1,
  }),
  Object.freeze({
    id: 'comm_end5',
    commissionId: 'comm_end5',
    order: 6,
    title: 'Box-Office Chaos',
    shortTitle: 'Box-Office Chaos',
    description: 'Unlock //END5: Sauin Never Exists (Chaos >= 6).',
    shortDescription: 'Unlock //END5 (Chaos >= 6).',
    oroberyl: 40,
    tCreds: 5000,
    kind: 'ending',
    requiredEndingId: 'END5',
    target: 1,
  }),
  Object.freeze({
    id: 'comm_takes_10',
    commissionId: 'comm_takes_10',
    order: 7,
    title: 'Seasoned Filmmaker',
    shortTitle: 'Seasoned Filmmaker',
    description: 'Record 10 distinct Stage Takes in the Film Album.',
    shortDescription: 'Record 10 Stage Takes.',
    oroberyl: 20,
    tCreds: 5000,
    kind: 'takes_count',
    target: 10,
  }),
  Object.freeze({
    id: 'comm_master_all',
    commissionId: 'comm_master_all',
    order: 8,
    title: 'Auteur of All Souls',
    shortTitle: 'Auteur of All Souls',
    description: 'Unlock all 20/20 Stage Takes and all 5/5 Endings.',
    shortDescription: 'Unlock all 20 Takes & 5 Endings.',
    oroberyl: 20,
    tCreds: 5000,
    kind: 'master_all',
    target: TOTAL_TAKES + TOTAL_ENDINGS,
  }),
]);

export const COMMISSION_LIST = COMMISSIONS;

export const COMMISSION_MAP = Object.freeze(
  Object.fromEntries(COMMISSIONS.map((c) => [c.id, c])),
);

export function getCommission(id) {
  return (id && COMMISSION_MAP[id]) || null;
}

const ACT1_TAKE_IDS = new Set(['take_1_1', 'take_1_2', 'take_1_3', 'take_1_4']);

export function evaluateCommission(commissionOrId, progress = {}) {
  const comm =
    typeof commissionOrId === 'string' ? COMMISSION_MAP[commissionOrId] : commissionOrId;
  if (!comm) {
    return { current: 0, target: 1, completed: false, claimed: false, claimable: false };
  }

  const unlockedTakes = Array.isArray(progress.unlockedTakes) ? progress.unlockedTakes : [];
  const unlockedEndings = Array.isArray(progress.unlockedEndings) ? progress.unlockedEndings : [];
  const claimedCommissions = Array.isArray(progress.claimedCommissions)
    ? progress.claimedCommissions
    : [];

  let current = 0;
  switch (comm.kind) {
    case 'act1_complete': {
      const done =
        unlockedTakes.some((id) => ACT1_TAKE_IDS.has(id)) ||
        (Number(progress.runsCompleted) || 0) > 0;
      current = done ? 1 : 0;
      break;
    }
    case 'any_ending':
      current = unlockedEndings.length > 0 ? 1 : 0;
      break;
    case 'ending':
      current = unlockedEndings.includes(comm.requiredEndingId) ? 1 : 0;
      break;
    case 'takes_count':
      current = Math.min(comm.target, unlockedTakes.length);
      break;
    case 'master_all':
      current = Math.min(
        comm.target,
        Math.min(TOTAL_TAKES, unlockedTakes.length) +
          Math.min(TOTAL_ENDINGS, unlockedEndings.length),
      );
      break;
    default:
      current = 0;
  }

  const completed = current >= comm.target;
  const claimed = claimedCommissions.includes(comm.id);
  return {
    current,
    target: comm.target,
    completed,
    claimed,
    claimable: completed && !claimed,
  };
}
