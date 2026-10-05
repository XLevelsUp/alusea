-- Seed post: "Commercial Curtain Walls: How They Shape Modern Building Facades"
--
-- BEFORE RUNNING: replace the placeholder image URL below with a real
-- upload. Upload the photo via the admin blog form, or manually into the
-- 'alusea-assets' Supabase Storage bucket, then paste the public URL here
-- in place of the '__REPLACE_WITH_...' placeholder.
--
-- Suggested featured image: contemporary commercial building with a glass and aluminium curtain wall facade.

INSERT INTO public.blog_posts (
    slug,
    title,
    featured_image_url,
    featured_image_alt,
    category,
    tags,
    author,
    reading_time_minutes,
    intro_html,
    second_image_url,
    second_image_alt,
    sections,
    qa,
    cta,
    published_at,
    updated_at
) VALUES (
    'commercial-curtain-walls-how-they-shape-modern-building-facades',
    'Commercial Curtain Walls: How They Shape Modern Building Facades',

    '__REPLACE_WITH_FEATURED_IMAGE_URL__',
    'Modern commercial building with aluminium glass curtain wall facade',

    'Commercial Curtain Wall',
    ARRAY['Commercial Curtain Wall', 'Glass Facade', 'Aluminium Facade', 'Curtain Wall Glazing', 'Commercial Architecture'],
    'Alusea Team',
    7,

    '<p>The facade is one of the first things people notice about a commercial building. Beyond appearance, it plays an important role in daylight, weather protection, thermal performance, structural requirements and the overall architectural identity of the project.</p>
<p>Curtain wall systems are widely used when architects want a continuous glass-and-aluminium exterior with a modern appearance. Rather than treating individual windows as separate elements, a curtain wall creates a coordinated facade system.</p>
<p>For architects, developers and builders, the important question is not simply whether a building should have a glass facade. It is how the facade system should be designed and specified for the building''s actual requirements.</p>
<p>Alusea''s catalogue includes a Commercial Curtain Wall system intended for high-rise commercial structures, with stated options including photovoltaic integration and a 150mm mullion depth.</p>',

    NULL,
    NULL,

    '[
      {
        "heading": "WHAT IS A COMMERCIAL CURTAIN WALL?",
        "body_html": "<p>A curtain wall is a lightweight exterior facade system that typically combines aluminium framing with glass or other infill materials.</p><p>Unlike a conventional load-bearing wall, the curtain wall primarily forms the building envelope while the main structural frame carries the building''s principal loads.</p>",
        "subsections": [
          {
            "heading": "Where Are Curtain Walls Commonly Used?",
            "body_html": "<p>Curtain wall systems can be considered for:</p><ul><li>Office buildings</li><li>Commercial developments</li><li>Hotels</li><li>Institutional buildings</li><li>High-rise structures</li><li>Mixed-use developments</li><li>Large contemporary residential projects</li></ul><p>The exact system should be selected according to the building''s height, exposure, structural requirements, glazing specification and architectural design.</p>"
          },
          {
            "heading": "Why Aluminium Is Used",
            "body_html": "<p>Aluminium is particularly useful for facade systems because it can provide a combination of structural capability, design flexibility and relatively low visual mass.</p><p>Its ability to be formed into different profiles also allows facade designers to develop vertical and horizontal framing patterns that respond to the architecture.</p>"
          }
        ]
      },
      {
        "heading": "WHAT SHOULD ARCHITECTS CONSIDER WHEN SPECIFYING A CURTAIN WALL?",
        "body_html": "",
        "subsections": [
          {
            "heading": "1. Structural Requirements",
            "body_html": "<p>Facade systems must be designed around the building and its environmental conditions.</p><p>Wind pressure, building height, span, glass weight and mullion/transom configuration all influence the required specification.</p><p>Alusea''s catalogue lists its Commercial Curtain Wall with a stated wind-load specification of up to 3000 Pa. Project-specific engineering should still determine the appropriate system and configuration.</p>"
          },
          {
            "heading": "2. Glass and Daylight",
            "body_html": "<p>Glass selection has a major effect on the performance and appearance of a curtain wall.</p><p>Depending on the building, specifications may include:</p><ul><li>Double glazing</li><li>Low-E glass</li><li>Solar-control glass</li><li>Acoustic glass</li><li>Laminated glass</li><li>Toughened glass</li></ul><p>The objective is to balance daylight with thermal, acoustic and safety requirements.</p>"
          },
          {
            "heading": "3. Weather Performance",
            "body_html": "<p>A facade has to deal with external weather conditions throughout its service life.</p><p>Air infiltration, water management, drainage, seals and installation quality therefore need to be considered during specification.</p>"
          },
          {
            "heading": "4. Architectural Appearance",
            "body_html": "<p>A curtain wall is also a design element.</p><p>Mullion spacing, transom lines, glass colour, surface finish and facade proportions can significantly influence how a building appears from both close and distant views.</p>"
          },
          {
            "heading": "5. Practical Specification Checklist",
            "body_html": "<ul><li>Review structural and wind-load requirements</li><li>Select glazing according to building performance needs</li><li>Plan drainage, seals and weather management</li><li>Coordinate facade design with structural and MEP requirements</li></ul>"
          },
          {
            "heading": "6. Alusea Solution",
            "body_html": "<p>Alusea positions itself as an architectural aluminium facade manufacturer and curtain wall glazing supplier in Coimbatore, offering custom architectural glazing solutions for commercial and high-rise applications.</p><p>Its catalogue includes both Commercial Curtain Wall and Modern Facade System options, allowing the facade approach to be considered alongside other architectural requirements.</p>"
          }
        ]
      }
    ]'::jsonb,

    '[
      {
        "question": "What is a curtain wall?",
        "answer": "A curtain wall is a non-load-bearing exterior facade system that typically uses aluminium framing with glass or other infill materials."
      },
      {
        "question": "Where are curtain walls used?",
        "answer": "They are commonly considered for commercial, institutional, high-rise and other buildings requiring large continuous facade surfaces."
      },
      {
        "question": "Is every glass facade a curtain wall?",
        "answer": "No. A glass facade can use different systems and construction methods. The term curtain wall refers to a particular type of building-envelope system."
      },
      {
        "question": "Why is aluminium commonly used in curtain walls?",
        "answer": "Aluminium offers profile flexibility, durability and the ability to create relatively slim facade framing."
      },
      {
        "question": "Does the glass specification matter?",
        "answer": "Yes. Glass influences daylight, solar control, thermal performance, acoustics and safety, so it should be specified as part of the overall facade system."
      }
    ]'::jsonb,

    '{
      "intro": "A successful curtain wall is the result of coordination between architecture, structural engineering, glazing and installation. The facade should be evaluated as a complete system rather than based only on its visual appearance. Discuss your commercial facade requirements with Alusea''s architectural systems team.",
      "buttons": [
        { "label": "Explore Facade Systems", "href": "/products" },
        { "label": "Contact Alusea", "href": "/contact" },
        { "label": "Request a Quote", "href": "/contact" }
      ]
    }'::jsonb,

    '2026-09-28'::timestamptz,
    '2026-09-28'::timestamptz
)
ON CONFLICT (slug) DO NOTHING;
