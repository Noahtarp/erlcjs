let lastScrollTop = 0;
let currentDir = 'down';

let animState = { startX: 0, startY: 0, endX: 0, endY: 0, pathPoints: [] };
let targetState = null;
let isAnimating = false;

window.addEventListener('scroll', () => {
  let st = window.pageYOffset || document.documentElement.scrollTop;
  currentDir = st > lastScrollTop ? 'down' : 'up';
  lastScrollTop = st <= 0 ? 0 : st;
  updateLineCoords();
  updateMobileProgress();
}, { passive: true });

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const id = entry.target.getAttribute('id');
    const tocLink = document.querySelector(`starlight-toc nav ul li a[href="#${id}"]`);
    if (!tocLink) return;
    if (entry.isIntersecting) {
      tocLink.classList.add('is-visible');
    } else {
      tocLink.classList.remove('is-visible');
    }
  });
  updateLineCoords();
}, { rootMargin: '-2% 0px -2% 0px', threshold: 0 });

function updateMobileProgress() {
  const mobileSummary = document.querySelector('mobile-starlight-toc summary');
  if (!mobileSummary) return;

  let progressContainer = mobileSummary.querySelector('.mobile-toc-progress-container');
  if (!progressContainer) {
    progressContainer = document.createElement('div');
    progressContainer.setAttribute('class', 'mobile-toc-progress-container');
    progressContainer.innerHTML = '<div class="mobile-toc-progress-bar"></div><span class="mobile-toc-direction-circle"></span>';
    mobileSummary.appendChild(progressContainer);
  }

  const bar = progressContainer.querySelector('.mobile-toc-progress-bar');
  const circle = progressContainer.querySelector('.mobile-toc-direction-circle');

  const h = document.documentElement;
  const b = document.body;
  const st = 'scrollTop';
  const sh = 'scrollHeight';
  const percent = (h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight) * 100;

  bar.style.width = percent + '%';
  circle.style.left = percent + '%';
}

function updateLineCoords() {
  const container = document.querySelector('starlight-toc nav');
  const rootUl = document.querySelector('starlight-toc > nav > ul');
  if (!container || !rootUl) return;

  const allLinks = Array.from(container.querySelectorAll('ul li a'));
  const visibleLinks = Array.from(container.querySelectorAll('ul li a.is-visible'));
  const currentLink = container.querySelector('ul li a[aria-current="true"]');
  
  let targets = [...visibleLinks];
  if (currentLink && !targets.includes(currentLink)) {
    targets.push(currentLink);
  }
  
  targets.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);

  if (targets.length === 0 || allLinks.length === 0) return;

  const containerRect = container.getBoundingClientRect();
  const baseLeftX = rootUl.getBoundingClientRect().left - containerRect.left;
  
  let svg = container.querySelector('.toc-indicator-svg');
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'toc-indicator-svg');
    svg.innerHTML = `
      <path class="toc-indicator-rail" />
      <path class="toc-indicator-line" />
      <circle class="toc-indicator-circle" r="2.5" />
    `;
    container.appendChild(svg);
  }
  const railEl = svg.querySelector('.toc-indicator-rail');
  let railData = '';
  
  allLinks.forEach((link, idx) => {
    const linkRect = link.getBoundingClientRect();
    const depthOffset = link.parentElement.closest('ul ul') ? 12 : 0;
    const x = baseLeftX + depthOffset;
    const yStart = linkRect.top - containerRect.top + 6;
    const yEnd = linkRect.bottom - containerRect.top - 6;

    if (idx === 0) {
      railData += `M ${x} ${yStart} L ${x} ${yEnd}`;
    } else {
      railData += ` L ${x} ${yStart} L ${x} ${yEnd}`;
    }
  });
  railEl.setAttribute('d', railData);

  let points = [];
  targets.forEach((link) => {
    const linkRect = link.getBoundingClientRect();
    const depthOffset = link.parentElement.closest('ul ul') ? 12 : 0;
    const x = baseLeftX + depthOffset;
    const yStart = linkRect.top - containerRect.top + 6;
    const yEnd = linkRect.bottom - containerRect.top - 6;
    points.push({ x, yStart, yEnd });
  });

  targetState = {
    startX: points[0].x,
    startY: points[0].yStart,
    endX: points[points.length - 1].x,
    endY: points[points.length - 1].yEnd,
    pathPoints: points
  };

  if (!isAnimating) {
    isAnimating = true;
    renderLoop();
  }
}

function renderLoop() {
  if (!targetState) {
    isAnimating = false;
    return;
  }

  const container = document.querySelector('starlight-toc nav');
  if (!container) return;

  const svg = container.querySelector('.toc-indicator-svg');
  const pathEl = svg.querySelector('.toc-indicator-line');
  const circleEl = svg.querySelector('.toc-indicator-circle');

  const ease = 0.2;
  
  if (animState.pathPoints.length === 0) {
    animState = { ...targetState };
  } else {
    animState.startX += (targetState.startX - animState.startX) * ease;
    animState.startY += (targetState.startY - animState.startY) * ease;
    animState.endX += (targetState.endX - animState.endX) * ease;
    animState.endY += (targetState.endY - animState.endY) * ease;

    const maxLen = Math.max(animState.pathPoints.length, targetState.pathPoints.length);
    let nextPoints = [];
    for (let i = 0; i < maxLen; i++) {
      let curr = animState.pathPoints[i] || animState.pathPoints[animState.pathPoints.length - 1];
      let targ = targetState.pathPoints[i] || targetState.pathPoints[targetState.pathPoints.length - 1];
      nextPoints.push({
        x: curr.x + (targ.x - curr.x) * ease,
        yStart: curr.yStart + (targ.yStart - curr.yStart) * ease,
        yEnd: curr.yEnd + (targ.yEnd - curr.yEnd) * ease
      });
    }
    animState.pathPoints = nextPoints;
  }

  let pathData = '';
  animState.pathPoints.forEach((pt, idx) => {
    if (idx === 0) {
      pathData += `M ${pt.x} ${pt.yStart} L ${pt.x} ${pt.yEnd}`;
    } else {
      pathData += ` L ${pt.x} ${pt.yStart} L ${pt.x} ${pt.yEnd}`;
    }
  });
  pathEl.setAttribute('d', pathData);

  if (currentDir === 'down') {
    circleEl.setAttribute('cx', animState.endX);
    circleEl.setAttribute('cy', animState.endY);
  } else {
    circleEl.setAttribute('cx', animState.startX);
    circleEl.setAttribute('cy', animState.startY);
  }

  let dist = Math.abs(targetState.startY - animState.startY) + Math.abs(targetState.endY - animState.endY);
  if (dist < 0.1) {
    animState = { ...targetState };
    isAnimating = false;
  } else {
    requestAnimationFrame(renderLoop);
  }
}

function initTocObserver() {
  document.querySelectorAll('main h2, main h3').forEach(heading => observer.observe(heading));
  setTimeout(() => { updateLineCoords(); updateMobileProgress(); }, 150);
}

document.addEventListener('astro:page-load', initTocObserver);
document.addEventListener('DOMContentLoaded', initTocObserver);
window.addEventListener('resize', () => { updateLineCoords(); updateMobileProgress(); });