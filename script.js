document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const reviewForm = document.getElementById('add-review-form');
    const reviewerNameInput = document.getElementById('reviewer-name');
    const commentInput = document.getElementById('comment');
    const reviewsListDiv = document.getElementById('reviews-list');
    const searchTermInput = document.getElementById('search-term');
    const filterRatingSelect = document.getElementById('filter-rating');
    const averageRatingDisplay = document.getElementById('average-rating-display');
    const currentYearSpan = document.getElementById('current-year');

    // Emoji Rating Elements
    const emojiRatingContainer = document.querySelector('.emoji-rating-input');
    const emojis = emojiRatingContainer.querySelectorAll('.emoji-rating'); // Changed selector
    const hiddenRatingInput = document.getElementById('rating');
    const ratingLabelDisplay = document.getElementById('rating-label-display'); // Added selector
    const ratingError = document.getElementById('rating-error');

    // --- State ---
    let reviews = JSON.parse(localStorage.getItem('reviews')) || [];
    let currentRating = 0; // To store the selected rating

    // --- Helper Functions ---

    /**
     * Gets the emoji character and label for a given rating value.
     * @param {number} ratingValue - The rating (1-5).
     * @returns {object} Object with { emoji: 'char', label: 'text' } or null if invalid.
     */
    function getEmojiInfo(ratingValue) {
        const emojiMap = {
            1: { emoji: '😠', label: 'Terrible' },
            2: { emoji: '🙁', label: 'Bad' },
            3: { emoji: '😐', label: 'Okay' },
            4: { emoji: '🙂', label: 'Good' },
            5: { emoji: '😄', label: 'Excellent' },
        };
        return emojiMap[ratingValue] || null;
    }

    // --- Core Functions ---

    /**
     * Updates the visual state of the emojis based on hover or selection.
     * @param {number} ratingValue - The rating value (1-5) to highlight up to.
     * @param {boolean} isSelecting - True if this is a permanent selection (click).
     */
    function updateEmojis(ratingValue, isSelecting = false) {
        emojis.forEach(emoji => {
            const emojiValue = parseInt(emoji.dataset.value, 10);
            emoji.classList.remove('selected'); // Clear previous selected state

            // Add 'selected' class only if it's a click action
            if (isSelecting && emojiValue === ratingValue) {
                 emoji.classList.add('selected');
            }
            // Note: Hover visual effect (scale, grayscale) is now primarily handled by CSS :hover
            // We don't need a separate 'hovered' class in JS for this implementation.
        });
    }

    /**
     * Shows the rating label above the emojis.
     * @param {string} labelText - The text to display (e.g., "Good").
     */
    function showRatingLabel(labelText) {
        ratingLabelDisplay.textContent = labelText;
        ratingLabelDisplay.classList.add('visible');
    }

    /** Hides the rating label. */
    function hideRatingLabel() {
        ratingLabelDisplay.classList.remove('visible');
        // Optional: Clear text after a delay for smoother transition out
        // setTimeout(() => { ratingLabelDisplay.textContent = ''; }, 200); // Match CSS transition
    }

    /** Calculates and displays the average rating. */
    function calculateAndDisplayAverageRating() {
        if (reviews.length === 0) {
            averageRatingDisplay.innerHTML = '<span class="no-rating">No ratings yet</span>';
            return;
        }

        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const average = (totalRating / reviews.length);
        const averageRounded = Math.round(average * 10) / 10;
        const averageStarsInt = Math.round(average); // Use this for emoji
        const avgEmojiInfo = getEmojiInfo(averageStarsInt);
        const avgEmojiHTML = avgEmojiInfo ? `<span class="rating-emoji" title="${avgEmojiInfo.label}">${avgEmojiInfo.emoji}</span>` : '';

        averageRatingDisplay.innerHTML = `
            ${avgEmojiHTML}
            <strong>${averageRounded} / 5</strong>
            <span class="review-count">(${reviews.length} review${reviews.length === 1 ? '' : 's'})</span>
        `;
    }

    /**
     * Renders the reviews list.
     * @param {Array} reviewsToDisplay - The array of review objects to display.
     * @param {number|null} newReviewId - The ID of a newly added review for animation.
     */
    function renderReviews(reviewsToDisplay, newReviewId = null) {
        reviewsListDiv.innerHTML = '';

        if (reviewsToDisplay.length === 0) {
            const message = (reviews.length === 0)
                ? 'Be the first to review the Modern Gadget Pro!'
                : 'No reviews match your current filters.';
            reviewsListDiv.innerHTML = `<p class="no-reviews-message">${message}</p>`;
            return;
        }

        reviewsToDisplay.forEach(review => {
            const reviewElement = document.createElement('div');
            reviewElement.classList.add('review-item');
            if (review.id === newReviewId) {
                reviewElement.classList.add('newly-added');
                setTimeout(() => { reviewElement.classList.remove('newly-added'); }, 500);
            }

            const name = review.name ? review.name : 'Anonymous';
            const reviewEmojiInfo = getEmojiInfo(review.rating);
            const ratingDisplayHTML = reviewEmojiInfo
                ? `<span class="rating-emoji" title="${review.rating}/5 - ${reviewEmojiInfo.label}">${reviewEmojiInfo.emoji}</span>`
                : `${review.rating}/5`; // Fallback if emoji not found

            const formattedTimestamp = new Date(review.timestamp).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });

            reviewElement.innerHTML = `
                <div class="review-header">
                     <h4>${escapeHTML(name)}</h4>
                     <div class="rating">${ratingDisplayHTML}</div>
                </div>
                <p class="comment-text">${escapeHTML(review.comment)}</p>
                <p class="timestamp">Reviewed on: ${formattedTimestamp}</p>
            `;
            reviewsListDiv.appendChild(reviewElement);
        });
    }

    /** Applies filters and re-renders. */
    function applyFiltersAndRender(newReviewId = null) {
        const searchTerm = searchTermInput.value.toLowerCase();
        const minRating = filterRatingSelect.value;
        let filteredReviews = reviews;

        if (searchTerm) {
            filteredReviews = filteredReviews.filter(review =>
                (review.name && review.name.toLowerCase().includes(searchTerm)) ||
                review.comment.toLowerCase().includes(searchTerm)
            );
        }
        if (minRating !== 'all') {
            const ratingValue = parseInt(minRating, 10);
            filteredReviews = filteredReviews.filter(review => review.rating >= ratingValue);
        }

        renderReviews(filteredReviews, newReviewId);
        calculateAndDisplayAverageRating();
    }

    /** Saves reviews to localStorage. */
    function saveReviews() {
        localStorage.setItem('reviews', JSON.stringify(reviews));
    }

    /** Basic HTML escaping. */
    function escapeHTML(str) {
        // ... (keep existing escapeHTML function) ...
         if (str === null || str === undefined) return '';
         return String(str)
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
    }

    /** Resets the emoji rating input visual state */
    function resetEmojiRatingInput() {
        currentRating = 0;
        hiddenRatingInput.value = '';
        emojiRatingContainer.dataset.rating = '0';
        updateEmojis(0, true); // Reset visual state (no emoji selected)
        hideRatingLabel();
        ratingError.style.display = 'none';
    }

    // --- Event Listeners ---

    // Emoji Rating Interaction
    emojis.forEach(emoji => {
        emoji.addEventListener('mouseover', () => {
            const hoverValue = parseInt(emoji.dataset.value, 10);
            const label = emoji.dataset.label || '';
            showRatingLabel(label); // Show label on hover
            // CSS handles the visual hover effect (scale/grayscale)
        });

        emoji.addEventListener('click', () => {
            currentRating = parseInt(emoji.dataset.value, 10);
            hiddenRatingInput.value = currentRating;
            emojiRatingContainer.dataset.rating = currentRating;
            updateEmojis(currentRating, true); // Update visuals permanently
            hideRatingLabel(); // Hide label after click confirms choice
            ratingError.style.display = 'none';
            console.log(`Rating selected: ${currentRating}`);
        });
    });

    // Hide label when mouse leaves the *container*
    emojiRatingContainer.addEventListener('mouseleave', () => {
        hideRatingLabel();
        // Optional: If you want emojis to visually reset to only the selected one
        // when the mouse leaves the container, uncomment the next line.
        // updateEmojis(currentRating, true);
    });


    // Form Submission
    reviewForm.addEventListener('submit', (event) => {
        event.preventDefault();

        if (!hiddenRatingInput.value || parseInt(hiddenRatingInput.value, 10) === 0) {
            ratingError.style.display = 'block';
            return;
        } else {
             ratingError.style.display = 'none';
        }

        const newReview = {
            id: Date.now(),
            name: reviewerNameInput.value.trim(),
            rating: parseInt(hiddenRatingInput.value, 10),
            comment: commentInput.value.trim(),
            timestamp: new Date().toISOString()
        };

        if (!newReview.comment) { // Already required, but double-check
            alert('Please provide a comment.');
            return;
        }

        reviews.unshift(newReview);
        saveReviews();
        applyFiltersAndRender(newReview.id);

        reviewForm.reset();
        resetEmojiRatingInput();
    });

    // Filters
    searchTermInput.addEventListener('input', () => applyFiltersAndRender());
    filterRatingSelect.addEventListener('change', () => applyFiltersAndRender());

    // Set current year in footer
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- Initial Load ---
    applyFiltersAndRender();
    resetEmojiRatingInput();
});
