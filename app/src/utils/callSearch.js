// callSearch.js — Search & filter logic for Call History
import { OUTCOMES } from '../data/mockData.js';

/**
 * Filter calls by search query and outcome.
 * - Multi-field search: prospectName, company, prospectTitle, phone, email, location, companyType, nextStep, summary, outcome
 * - Case-insensitive
 * - Trimmed matching
 * - Combined with outcome dropdown filter
 *
 * @param {Array} calls
 * @param {string} search
 * @param {string} filterOutcome
 * @returns {Array}
 */
export function filterCalls(calls = [], search = '', filterOutcome = '') {
  const q = (search || '').trim().toLowerCase();

  return calls.filter(call => {
    // 1. Outcome filter
    if (filterOutcome && call.outcome !== filterOutcome) {
      return false;
    }

    // 2. Query search
    if (!q) return true;

    const outcomeObj = OUTCOMES.find(o => o.id === call.outcome);
    const outcomeLabel = outcomeObj?.label?.toLowerCase() || '';

    const matchProspect    = call.prospectName?.toLowerCase().includes(q);
    const matchCompany     = call.company?.toLowerCase().includes(q);
    const matchTitle       = (call.prospectTitle || call.prospectRole)?.toLowerCase().includes(q);
    const matchPhone       = call.phone?.toLowerCase().includes(q);
    const matchEmail       = call.email?.toLowerCase().includes(q);
    const matchLocation    = call.location?.toLowerCase().includes(q);
    const matchCompanyType = call.companyType?.toLowerCase().includes(q);
    const matchNextStep    = call.nextStep?.toLowerCase().includes(q);
    const matchSummary     = (call.summary || call.callSynthesis)?.toLowerCase().includes(q);
    const matchOutcome     = (call.outcome?.toLowerCase().includes(q) || outcomeLabel.includes(q));

    return Boolean(
      matchProspect ||
      matchCompany ||
      matchTitle ||
      matchPhone ||
      matchEmail ||
      matchLocation ||
      matchCompanyType ||
      matchNextStep ||
      matchSummary ||
      matchOutcome
    );
  });
}
