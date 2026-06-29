// nav scroll state
const hdr=document.getElementById('hdr');
addEventListener('scroll',()=>hdr.classList.toggle('scrolled',scrollY>40));
// mobile menu
const burger=document.getElementById('burger'),links=document.getElementById('navlinks');
burger.addEventListener('click',()=>{burger.classList.toggle('open');links.classList.toggle('open')});
links.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{burger.classList.remove('open');links.classList.remove('open')}));
// reveal on scroll
const io=new IntersectionObserver((es)=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.14});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));


// ==================== REVIEWS CAROUSEL + SUBMIT ====================
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
      '<p class="review-text">“' + text + '”</p>' +
      '<p class="review-author">— ' + name + '</p>';
    return div;
  }

  // Load stored reviews from localStorage and inject into track
  var stored = [];
  try { stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch(e){}
  stored.forEach(function(r){
    track.appendChild(makeCard(r.name, r.rating, r.text));
  });

  // Carousel state
  var current = 0;
  var autoTimer;

  function buildDots(){
    dotsContainer.innerHTML = '';
    var cards = track.querySelectorAll('.review-card');
    cards.forEach(function(_, i){
      var dot = document.createElement('button');
      dot.className = 'review-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Review ' + (i+1));
      dot.addEventListener('click', function(){ goTo(i); resetAuto(); });
      dotsContainer.appendChild(dot);
    });
  }

  function goTo(idx){
    var cards = track.querySelectorAll('.review-card');
    var total = cards.length;
    current = ((idx % total) + total) % total;
    track.style.transform = 'translateX(-' + (current * 100) + '%)';
    dotsContainer.querySelectorAll('.review-dot').forEach(function(d, i){
      d.classList.toggle('active', i === current);
    });
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
