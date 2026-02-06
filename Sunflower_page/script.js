// Reveal Animation on Scroll
const reveals = document.querySelectorAll('.reveal');

const revealOnScroll = () => {
    const windowHeight = window.innerHeight;
    const revealPoint = 150;

    reveals.forEach(reveal => {
        const revealTop = reveal.getBoundingClientRect().top;

        if (revealTop < windowHeight - revealPoint) {
            reveal.classList.add('active');
        }
    });
};

// Initial call
revealOnScroll();

// Event listeners
window.addEventListener('scroll', revealOnScroll);

// Smooth Scroll for Navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Parallax effect for Hero Image
window.addEventListener('scroll', () => {
    const heroImg = document.getElementById('hero-img');
    const scrollValue = window.scrollY;
    if (heroImg) {
        heroImg.style.transform = `scale(${1 + scrollValue * 0.0005}) translateY(${scrollValue * 0.1}px)`;
    }
});

// Dynamic Navbar Background
const nav = document.getElementById('main-nav');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        nav.style.boxShadow = '0 10px 30px rgba(0,0,0,0.05)';
        nav.style.padding = '1rem 3rem';
    } else {
        nav.style.boxShadow = 'none';
        nav.style.padding = '1.5rem 3rem';
    }
});

// Mobile Menu Toggle
const mobileBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

if (mobileBtn && navLinks) {
    mobileBtn.addEventListener('click', () => {
        mobileBtn.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Close menu when a link is clicked
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            mobileBtn.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });
}

// Contact Form Submission
const contactForm = document.getElementById('contact-form');
const formSuccess = document.getElementById('form-success');

if (contactForm && formSuccess) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Dynamic button state
        const btn = contactForm.querySelector('button');
        const originalText = btn.innerText;
        btn.innerText = 'Sending...';
        btn.disabled = true;

        // Simulate API call
        setTimeout(() => {
            contactForm.style.display = 'none';
            formSuccess.classList.remove('hidden');
            formSuccess.style.opacity = '1';

            // Log for data verification
            const formData = new FormData(contactForm);
            console.log('Sunshine sent from:', formData.get('name'));
        }, 1500);
    });
}
