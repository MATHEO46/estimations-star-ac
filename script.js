const initialCandidates = [
  { name: 'Candidate A', votes: 0, color: '#f5c756' },
  { name: 'Candidate B', votes: 0, color: '#e75884' },
  { name: 'Candidate C', votes: 0, color: '#45c8d8' },
  { name: 'Candidate D', votes: 0, color: '#57d68d' },
  { name: 'Candidate E', votes: 0, color: '#b78cff' },
];

let candidates = structuredClone(initialCandidates);
let hasVoted = false;

const list = document.querySelector('#contestant-list');
const select = document.querySelector('#candidate-select');
const ranking = document.querySelector('#ranking');
const totalVotes = document.querySelector('#total-votes');
const leaderName = document.querySelector('#leader-name');
const voteForm = document.querySelector('#vote-form');
const voteButton = document.querySelector('#vote-button');
const voteMessage = document.querySelector('#vote-message');
const predictionNote = document.querySelector('#prediction-note');
const trendLeader = document.querySelector('#trend-leader');
const trendGap = document.querySelector('#trend-gap');
const trendTotal = document.querySelector('#trend-total');
const contactForm = document.querySelector('#contact-form');
const contactMessage = document.querySelector('#contact-message');
const loader = document.querySelector('#loader');

document.body.classList.add('is-loading');

function hideLoader() {
  window.setTimeout(() => {
    loader.classList.add('is-hidden');
    document.body.classList.remove('is-loading');
  }, 650);
}

function getTotalVotes() {
  return candidates.reduce((sum, candidate) => sum + candidate.votes, 0);
}

function getSortedCandidates() {
  return [...candidates].sort((a, b) => b.votes - a.votes);
}

function getPercentage(votes, total) {
  if (total === 0) return 0;
  return Math.round((votes / total) * 1000) / 10;
}

function renderCandidateList() {
  list.innerHTML = candidates
    .map((candidate) => {
      const initials = candidate.name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      return `
        <article class="contestant">
          <div class="avatar" style="background:${candidate.color}">${initials}</div>
          <div>
            <strong>${candidate.name}</strong>
            <span>${candidate.votes.toLocaleString('fr-FR')} votes</span>
          </div>
        </article>
      `;
    })
    .join('');
}

function renderSelect() {
  select.innerHTML = candidates
    .map((candidate) => `<option value="${candidate.name}">${candidate.name}</option>`)
    .join('');
}

function renderRanking() {
  const total = getTotalVotes();
  const sorted = getSortedCandidates();
  const leader = sorted[0];
  const runnerUp = sorted[1];
  const gap = leader && runnerUp ? leader.votes - runnerUp.votes : 0;
  const swing = Math.max(1, Math.round(total * 0.08));
  const isClose = runnerUp && gap <= swing;

  totalVotes.textContent = total.toLocaleString('fr-FR');
  leaderName.textContent = leader ? leader.name : '-';
  trendTotal.textContent = total.toLocaleString('fr-FR');
  trendLeader.textContent = total === 0 ? '-' : leader.name;
  trendGap.textContent = runnerUp && total > 0
    ? `${Math.abs(gap).toLocaleString('fr-FR')} vote(s) d'ecart`
    : '-';

  ranking.innerHTML = sorted
    .map((candidate, index) => {
      const percent = getPercentage(candidate.votes, total);
      return `
        <article class="rank-row">
          <div class="rank-row__position">#${index + 1}</div>
          <div>
            <strong>${candidate.name}</strong>
            <span>${percent}% des votes estimes</span>
          </div>
          <strong>${candidate.votes.toLocaleString('fr-FR')}</strong>
          <div class="meter" aria-hidden="true"><span style="width:${percent}%"></span></div>
        </article>
      `;
    })
    .join('');

  if (!leader || total === 0) {
    predictionNote.textContent = 'Les premiers votes permettront de lancer une estimation.';
  } else if (isClose) {
    predictionNote.textContent = `${leader.name} est devant, mais ${runnerUp.name} reste tres proche.`;
  } else {
    predictionNote.textContent = `${leader.name} a une avance solide selon les votes recus.`;
  }
}

function render() {
  renderCandidateList();
  renderSelect();
  renderRanking();
  voteButton.disabled = hasVoted;
  voteMessage.textContent = hasVoted
    ? 'Merci, ton vote a bien ete pris en compte.'
    : 'Un vote par appareil est autorise.';
}

function getVisitorId() {
  const saved = localStorage.getItem('star-academy-visitor-id');
  if (saved) return saved;

  const visitorId = crypto.randomUUID();
  localStorage.setItem('star-academy-visitor-id', visitorId);
  return visitorId;
}

function updateCandidates(nextCandidates) {
  candidates = nextCandidates;
  render();
}

voteForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (hasVoted) return;

  voteButton.disabled = true;
  voteMessage.textContent = 'Vote en cours...';

  fetch('/api/vote', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      candidate: select.value,
      visitorId: getVisitorId(),
    }),
  })
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok && response.status !== 409) throw new Error(data.error || 'Vote impossible.');
      if (data.candidates) updateCandidates(data.candidates);
      hasVoted = true;
      render();
      if (response.status === 409) {
        voteMessage.textContent = 'Vous avez deja vote pour cette estimation.';
      }
    })
    .catch(() => {
      voteButton.disabled = false;
      voteMessage.textContent = 'Le vote ne passe pas pour le moment. Reessaie dans quelques secondes.';
    });
});

contactForm.addEventListener('submit', (event) => {
  event.preventDefault();
  contactForm.reset();
  contactMessage.textContent = 'Merci, votre message a ete prepare. Ajoutez votre email dans les mentions legales pour recevoir les demandes.';
});

fetch('/api/results')
  .then((response) => response.json())
  .then((data) => updateCandidates(data.candidates))
  .catch(() => {
    voteMessage.textContent = 'Le classement en ligne ne charge pas pour le moment.';
    render();
  })
  .finally(hideLoader);
