// nav scroll state — passive listener avoids forced-reflow jank
const hdr = document.getElementById('hdr');
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      hdr.classList.toggle('scrolled', window.scrollY > 40);
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });

// mobile menu
const burger = document.getElementById('burger'), links = document.getElementById('navlinks');
burger.addEventListener('click', () => { burger.classList.toggle('open'); links.classList.toggle('open'); });
links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { burger.classList.remove('open'); links.classList.remove('open'); }));

// reveal on scroll
const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .14 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));


// =================== REVIEWS CAROUSEL + SUBMIT ===================
(function(){
  var STORAGE_KEY = 'aio-user-reviews';
  var track = document.getElementById('reviewsTrack');
  var dotsContainer = document.getElementById('reviewDots');
  if(!track) return;

  // Helper: build a star string
  function starsHTML(n){
    var s = '';
    for(var i=0;i<5;i++) s += (i < n ? '&#9733;' : '&#9734;');
    return s;
  }

  // Helper: create a card element
  function makeCard(name, rating, text){
    var div = document.createElement('div');
    div.className = 'review-card';
    div.innerHTML =
      '<div class="review-stars">' + starsHTML(rating) + '</div>' +
      '<p class="review-text">"' + text + '"</p>' +
      '<p class="review-author">— ' + name + '</p>';
    return div;
  }

  // Build dot nav — batch all reads before writes to avoid forced reflow
  function buildDots(){
    dotsContainer.innerHTML = '';
    var cards = track.querySelectorAll('.review-card');
    // Read phase: collect card count
    var cardCount = cards.length;
    // Write phase: build dots fragment then append once
    var frag = document.createDocumentFragment();
    for (var i = 0; i < cardCount; i++) {
      (function(idx){
        var dot = document.createElement('button');
        dot.className = 'review-dot' + (idx === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Review ' + (idx+1));
        dot.addEventListener('click', function(){ goTo(idx); resetAuto(); });
        frag.appendChild(dot);
      })(i);
    }
    dotsContainer.appendChild(frag);
  }

  var current = 0;
  var autoTimer;

  // goTo: read all layout values first, then write — eliminates forced reflow
  function goTo(idx){
    var cards = track.querySelectorAll('.review-card');
    var total = cards.length;               // read
    var dots = dotsContainer.querySelectorAll('.review-dot'); // read
    current = ((idx % total) + total) % total; // pure math
    // Write phase (no reads after this point)
    track.style.transform = 'translateX(-' + (current * 100) + '%)';
    dots.forEach(function(d, i){ d.classList.toggle('active', i === current); });
  }

  function resetAuto(){
    clearInterval(autoTimer);
    autoTimer = setInterval(function(){ goTo(current + 1); }, 5000);
  }

  // Initial build
  buildDots();
  document.getElementById('reviewPrev').addEventListener('click', function(){ goTo(current - 1); resetAuto(); });
  document.getElementById('reviewNext').addEventListener('click', function(){ goTo(current + 1); resetAuto(); });
  resetAuto();

  // Write-a-review form handler
  var form = document.getElementById('writeReviewForm');
  if(!form) return;
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var data = new FormData(form);
    var name = (data.get('name') || 'Guest').trim();
    var rating = parseInt(data.get('rating') || '5', 10);
    var text = (data.get('review') || '').trim();

    // Save to localStorage so it persists across visits
    var existing = [];
    try { existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch(e){}
    existing.push({ name: name, rating: rating, text: text });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

    // Add card to carousel immediately
    track.appendChild(makeCard(name, rating, text));
    buildDots();
    goTo(track.querySelectorAll('.review-card').length - 1);
    resetAuto();

    // Send to Formspree
    fetch(form.action, { method:'POST', body:data, headers:{ 'Accept':'application/json' } })
      .then(function(r){
        if(r.ok){
          form.style.display = 'none';
          document.getElementById('wrfSuccess').style.display = 'block';
        } else {
          alert('Oops! Something went wrong. Please try again.');
        }
      })
      .catch(function(){ alert('Network error. Please check your connection.'); });
  });
})();
