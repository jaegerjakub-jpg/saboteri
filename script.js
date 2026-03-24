const funnelConfig = {
  leadEndpoint: "",
  callBookingUrl: "https://calendly.com/jaegerjakub/uvodni_schuzka",
  thankYouPage: "thank-you.html",
  sequenceTag: "saboters-test",
};

const revealElements = document.querySelectorAll(
  ".section, .hero-card, .content-card, .benefit-item, .sequence-card, .thank-you-shell"
);

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.14,
      rootMargin: "0px 0px -40px 0px",
    }
  );

  revealElements.forEach((element) => {
    element.classList.add("reveal");
    observer.observe(element);
  });
} else {
  revealElements.forEach((element) => {
    element.classList.add("is-visible");
  });
}

document.querySelectorAll("[data-call-link]").forEach((link) => {
  link.setAttribute("href", funnelConfig.callBookingUrl);
});

const leadForm = document.querySelector("[data-lead-form]");

if (leadForm) {
  const statusNode = leadForm.querySelector("[data-form-status]");
  const submitButton = leadForm.querySelector('button[type="submit"]');

  leadForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(leadForm);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      source: "landing-page",
      tag: funnelConfig.sequenceTag,
      timestamp: new Date().toISOString(),
    };

    if (!payload.name || !payload.email) {
      showFormStatus(statusNode, "Vyplňte prosím jméno a e-mail.", true);
      return;
    }

    if (!isValidEmail(payload.email)) {
      showFormStatus(statusNode, "Zadejte prosím e-mail správně.", true);
      return;
    }

    submitButton.disabled = true;
    showFormStatus(statusNode, "Odesílám...", false);

    try {
      await submitLead(payload);
      sessionStorage.setItem("leadCapture", JSON.stringify(payload));
      window.location.href = funnelConfig.thankYouPage;
    } catch (error) {
      showFormStatus(
        statusNode,
        "Teď se to nepodařilo odeslat. Zkuste to prosím znovu.",
        true
      );
      submitButton.disabled = false;
    }
  });
}

const nameTarget = document.querySelector("[data-lead-name]");

if (nameTarget) {
  try {
    const rawLead = sessionStorage.getItem("leadCapture");
    if (rawLead) {
      const lead = JSON.parse(rawLead);
      if (lead && lead.name) {
        nameTarget.textContent = `Děkuji, ${lead.name}.`;
      }
    }
  } catch (error) {
    // Ignore malformed session data.
  }
}

function showFormStatus(node, message, isError) {
  if (!node) {
    return;
  }

  node.textContent = message;
  node.classList.toggle("is-error", isError);
  node.classList.toggle("is-success", !isError && message !== "");
}

async function submitLead(payload) {
  if (!funnelConfig.leadEndpoint) {
    return Promise.resolve(payload);
  }

  const response = await fetch(funnelConfig.leadEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Lead submission failed");
  }

  return response.json().catch(() => ({}));
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
