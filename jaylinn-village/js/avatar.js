// Jaylinn Village – poppetjes tekenen (chibi-stijl) op een canvas.
(function (JV) {
  const AGES = {
    volw: { sc: 1, leg: 26, torso: 30, head: 28 },
    tiener: { sc: 0.92, leg: 24, torso: 27, head: 28 },
    kind: { sc: 0.78, leg: 18, torso: 22, head: 29 },
    peuter: { sc: 0.64, leg: 13, torso: 19, head: 30 },
    baby: { sc: 0.54, leg: 9, torso: 17, head: 31 },
  };

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function circle(ctx, x, y, r, fill) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); }
  function ellipse(ctx, x, y, rx, ry, fill, rot) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); }

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.max(0, Math.min(255, Math.round(r + amt))); g = Math.max(0, Math.min(255, Math.round(g + amt))); b = Math.max(0, Math.min(255, Math.round(b + amt)));
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }
  JV.shade = shade;

  function capShape(ctx, cy, R) {
    ctx.beginPath();
    ctx.arc(0, cy, R + 3, Math.PI * 0.93, Math.PI * 2.07);
    ctx.lineTo(R * 0.92, cy - R * 0.2);
    ctx.quadraticCurveTo(R * 0.3, cy - R * 0.62, -R * 0.1, cy - R * 0.42);
    ctx.quadraticCurveTo(-R * 0.55, cy - R * 0.5, -R * 0.92, cy - R * 0.2);
    ctx.closePath();
  }

  function hairBack(ctx, look, cy, R, torsoTop) {
    const c = look.hairColor;
    switch (look.hair) {
      case 'lang':
        rr(ctx, -R - 5, cy - R * 0.6, 2 * R + 10, R * 1.95, 14); ctx.fillStyle = shade(c, -12); ctx.fill();
        break;
      case 'afro':
        circle(ctx, 0, cy - 5, R * 1.42, c);
        break;
      case 'staart':
        ellipse(ctx, R * 0.95, cy - R * 0.35, 9, 20, shade(c, -8), 0.5);
        break;
      case 'vlechtjes':
        circle(ctx, -R * 1.08, cy - R * 0.15, 11, c); circle(ctx, R * 1.08, cy - R * 0.15, 11, c);
        break;
      case 'knot':
        circle(ctx, 0, cy - R - 7, 12, c);
        break;
      case 'hoofddoek': {
        ctx.beginPath();
        ctx.arc(0, cy, R + 7, Math.PI * 0.75, Math.PI * 2.25);
        ctx.lineTo(R + 10, torsoTop + 14);
        ctx.quadraticCurveTo(0, torsoTop + 22, -R - 10, torsoTop + 14);
        ctx.closePath();
        ctx.fillStyle = shade(c, -10); ctx.fill();
        break;
      }
    }
  }

  function hairFront(ctx, look, cy, R) {
    const c = look.hairColor;
    ctx.fillStyle = c;
    switch (look.hair) {
      case 'hoofddoek': {
        ctx.beginPath();
        ctx.arc(0, cy, R + 7, Math.PI * 0.82, Math.PI * 2.18);
        ctx.arc(0, cy + 4, R - 3, Math.PI * 2.12, Math.PI * 0.88, true);
        ctx.closePath(); ctx.fill();
        break;
      }
      case 'krul':
        capShape(ctx, cy, R); ctx.fill();
        for (let a = 0.92; a <= 2.08; a += 0.14) circle(ctx, Math.cos(a * Math.PI) * (R + 1), cy + Math.sin(a * Math.PI) * (R + 1), 7.5, c);
        break;
      case 'afro':
        for (let a = 1.0; a <= 2.0; a += 0.125) circle(ctx, Math.cos(a * Math.PI) * (R * 0.95), cy - 4 + Math.sin(a * Math.PI) * (R * 0.8), 9, c);
        break;
      case 'lang':
        capShape(ctx, cy, R); ctx.fill();
        rr(ctx, -R - 4, cy - R * 0.3, 9, R * 1.2, 4); ctx.fill();
        rr(ctx, R - 5, cy - R * 0.3, 9, R * 1.2, 4); ctx.fill();
        break;
      case 'staart':
        capShape(ctx, cy, R); ctx.fill();
        circle(ctx, R * 0.7, cy - R * 0.78, 5, '#F06A96');
        break;
      case 'vlechtjes':
        capShape(ctx, cy, R); ctx.fill();
        circle(ctx, -R * 0.9, cy - R * 0.45, 4, '#F06A96'); circle(ctx, R * 0.9, cy - R * 0.45, 4, '#F06A96');
        break;
      case 'knot':
        capShape(ctx, cy, R); ctx.fill();
        break;
      default:
        capShape(ctx, cy, R); ctx.fill();
    }
  }

  // Tekent een poppetje met de voeten op (x, y). s = schaal (1 ≈ 130 px hoog voor een volwassene).
  JV.drawPerson = function (ctx, x, y, s, look, o) {
    o = o || {};
    const A = AGES[look.age || 'volw'] || AGES.volw;
    const bob = o.bob || 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s * A.sc * (o.flip ? -1 : 1), s * A.sc);
    const legTop = -A.leg - 4;
    const torsoTop = legTop - A.torso + 6 + bob;
    const R = A.head;
    const cy = torsoTop - R + 7;
    const skin = look.skin;

    if (!o.noShadow) ellipse(ctx, 0, 0, 22, 6, 'rgba(60,30,40,0.16)');
    hairBack(ctx, look, cy, R, torsoTop);

    // benen + schoenen
    const step = o.walk ? Math.sin(o.walk) * 3 : 0;
    ctx.fillStyle = look.pants;
    rr(ctx, -14, legTop + bob, 12, A.leg - bob + step * 0.3, 5); ctx.fill();
    rr(ctx, 2, legTop + bob, 12, A.leg - bob - step * 0.3, 5); ctx.fill();
    ellipse(ctx, -8 - step, -3, 8.5, 4.5, look.age === 'baby' ? skin : '#FFFFFF');
    ellipse(ctx, 8 + step, -3, 8.5, 4.5, look.age === 'baby' ? skin : '#FFFFFF');

    // romp + armen
    ctx.fillStyle = look.shirt;
    rr(ctx, -18, torsoTop, 36, A.torso, 11); ctx.fill();
    if (look.gender === 'v' && (look.age === 'volw' || look.age === 'tiener') && look.dress) {
      ctx.beginPath(); ctx.moveTo(-17, torsoTop + A.torso - 10); ctx.lineTo(17, torsoTop + A.torso - 10);
      ctx.lineTo(22, legTop + A.leg * 0.55); ctx.lineTo(-22, legTop + A.leg * 0.55); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = shade(look.shirt, -14);
    const armSwing = o.walk ? Math.sin(o.walk) * 2 : 0;
    rr(ctx, -26, torsoTop + 3 + armSwing, 10, A.torso - 7, 5); ctx.fill();
    rr(ctx, 16, torsoTop + 3 - armSwing, 10, A.torso - 7, 5); ctx.fill();
    circle(ctx, -21, torsoTop + A.torso - 3 + armSwing, 5, skin);
    circle(ctx, 21, torsoTop + A.torso - 3 - armSwing, 5, skin);
    if (o.badge) { circle(ctx, -8, torsoTop + 10, 5, '#F6C445'); circle(ctx, -8, torsoTop + 10, 2.4, '#E8708A'); }

    // hoofd
    ctx.fillStyle = skin; rr(ctx, -5, torsoTop - 6, 10, 9, 3); ctx.fill();
    circle(ctx, -R + 1, cy + 4, 6, shade(skin, -10));
    circle(ctx, R - 1, cy + 4, 6, shade(skin, -10));
    circle(ctx, 0, cy, R, skin);

    // gezicht
    const ey = cy + 5;
    const sad = o.mood === 'sad';
    const sleepy = o.mood === 'sleep';
    for (const ex of [-10, 10]) {
      if (sleepy || o.blink) {
        ctx.beginPath(); ctx.arc(ex, ey, 5, 0.15 * Math.PI, 0.85 * Math.PI); ctx.strokeStyle = '#2B1B12'; ctx.lineWidth = 2; ctx.stroke();
      } else {
        ellipse(ctx, ex, ey, 5.6, 7, '#2B1B12');
        ellipse(ctx, ex, ey + 1.5, 3.4, 4.4, '#5A3A26');
        circle(ctx, ex - 1.8, ey - 2.6, 2.1, '#FFFFFF');
        circle(ctx, ex + 1.8, ey + 2, 0.9, '#FFFFFF');
        if (look.gender === 'v') {
          ctx.beginPath(); ctx.moveTo(ex + (ex < 0 ? -5 : 5), ey - 5); ctx.lineTo(ex + (ex < 0 ? -8 : 8), ey - 7);
          ctx.strokeStyle = '#2B1B12'; ctx.lineWidth = 1.4; ctx.stroke();
        }
      }
    }
    ellipse(ctx, -16, ey + 8, 5, 3, 'rgba(240,110,130,0.33)');
    ellipse(ctx, 16, ey + 8, 5, 3, 'rgba(240,110,130,0.33)');
    ctx.beginPath();
    if (sad) ctx.arc(0, ey + 17, 4.5, 1.15 * Math.PI, 1.85 * Math.PI);
    else ctx.arc(0, ey + 9, 5, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.strokeStyle = '#7A3B2E'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.stroke();
    if (sad && !sleepy) { ellipse(ctx, -11, ey + 9, 1.8, 3, '#7FC3F0'); }

    if (look.beard) {
      ctx.beginPath(); ctx.arc(0, cy + 2, R - 1, 0.12 * Math.PI, 0.88 * Math.PI);
      ctx.arc(0, ey + 9, 7, 0.9 * Math.PI, 0.1 * Math.PI, true);
      ctx.closePath(); ctx.fillStyle = shade(look.hairColor === '#ECA2C4' ? '#5B3219' : look.hairColor, 0); ctx.globalAlpha = 0.9; ctx.fill(); ctx.globalAlpha = 1;
    }
    hairFront(ctx, look, cy, R);
    if (look.glasses) {
      ctx.strokeStyle = '#3A2A2A'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(-10, ey, 7.5, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(10, ey, 7.5, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-2.5, ey - 1); ctx.lineTo(2.5, ey - 1); ctx.stroke();
    }
    if (o.sash) {
      ctx.strokeStyle = '#F6C445'; ctx.lineWidth = 5; ctx.beginPath();
      ctx.moveTo(-16, torsoTop + 3); ctx.lineTo(15, torsoTop + A.torso - 4); ctx.stroke();
    }
    ctx.restore();
  };

  JV.randomLook = function (rng, age, gender) {
    const pick = (a) => a[Math.floor(rng() * a.length)];
    gender = gender || (rng() < 0.5 ? 'm' : 'v');
    const stylesM = ['kort', 'kort', 'krul', 'afro', 'knot'];
    const stylesV = ['lang', 'staart', 'vlechtjes', 'knot', 'krul', 'afro', 'hoofddoek'];
    let hair = gender === 'm' ? pick(stylesM) : pick(stylesV);
    if (hair === 'hoofddoek' && (age === 'baby' || age === 'peuter' || age === 'kind')) hair = 'lang';
    const hairColor = hair === 'hoofddoek' ? pick(['#C9A3C9', '#9EC3E6', '#E8B5A6', '#7C6FA8', '#E8D7B5']) : pick(JV.HAIR_COLORS.slice(0, 5));
    return {
      gender, age: age || 'volw', skin: pick(JV.SKINS), hair, hairColor,
      shirt: pick(JV.CLOTH_COLORS), pants: pick(JV.PANTS_COLORS),
      glasses: age === 'volw' && rng() < 0.25,
      beard: gender === 'm' && age === 'volw' && rng() < 0.35,
      dress: gender === 'v' && rng() < 0.3,
    };
  };

  // Een klein canvas met een poppetje, voor kaartjes en mini-games.
  JV.personCanvas = function (look, size, o) {
    const c = document.createElement('canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = size * dpr; c.height = size * dpr;
    c.style.width = size + 'px'; c.style.height = size + 'px';
    JV.paintPersonCanvas(c, look, o);
    return c;
  };
  JV.paintPersonCanvas = function (c, look, o) {
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    const A = AGES[look.age || 'volw'];
    const tall = (A.leg + A.torso + 2 * A.head + 6) * A.sc; // hoogte van voeten tot bovenkant haar
    const s = (c.height * 0.86) / tall;
    JV.drawPerson(ctx, c.width / 2, c.height * 0.96, s, look, o);
  };
})(window.JV);
