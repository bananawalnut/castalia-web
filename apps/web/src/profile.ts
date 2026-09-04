import {
  ZENITH_PERSON_ROLES,
  parseZenithIdentitySection,
  selectedIdentityDisclosure,
  type ClaimDisclosure,
  type ZenithAcademicInstitutionAffiliation,
  type ZenithIdentityFields,
  type ZenithIdentitySectionV1,
  type ZenithJournalRelationship,
} from "@castalia/castaway-contract";
import { elementFromHtml, escapeHtml, type View } from "./dom.js";
import type { StartWalletProvider } from "./start.js";
import type { WebWalletSession } from "./wallet/web-wallet-session.js";

export type ProfileDependencies = {
  webWalletSession?: WebWalletSession;
  getWalletProvider(): StartWalletProvider | undefined;
  onWalletChanged(): void;
};

const FIELD_LABELS: ReadonlyArray<{
  name: keyof ZenithIdentityFields;
  label: string;
  kind: "input" | "textarea";
  autocomplete?: string;
}> = [
  {
    name: "displayName",
    label: "Display name",
    kind: "input",
    autocomplete: "name",
  },
  {
    name: "givenName",
    label: "Given name",
    kind: "input",
    autocomplete: "given-name",
  },
  {
    name: "familyName",
    label: "Family name",
    kind: "input",
    autocomplete: "family-name",
  },
  { name: "headline", label: "Headline", kind: "input" },
  { name: "biography", label: "Biography", kind: "textarea" },
  {
    name: "website",
    label: "Website (HTTPS)",
    kind: "input",
    autocomplete: "url",
  },
  { name: "orcid", label: "ORCID", kind: "input" },
];

function message(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : "The profile operation failed";
}

function checked(disclosure: ClaimDisclosure): string {
  return disclosure === "selected" ? " checked" : "";
}

function fieldView(
  name: keyof ZenithIdentityFields,
  label: string,
  kind: "input" | "textarea",
  value: string,
  disclosure: ClaimDisclosure,
  autocomplete?: string,
): string {
  const input =
    kind === "textarea"
      ? `<textarea id="profile-${name}" name="${name}" rows="5">${escapeHtml(value)}</textarea>`
      : `<input id="profile-${name}" name="${name}" value="${escapeHtml(value)}"${autocomplete ? ` autocomplete="${autocomplete}"` : ""}>`;
  return `<div class="identity-claim"><label for="profile-${name}">${label}</label>${input}<label class="identity-claim__disclosure"><input type="checkbox" name="${name}Disclosure"${checked(disclosure)}> Include when I create a selected-claims file</label></div>`;
}

function affiliationView(
  affiliation: ZenithAcademicInstitutionAffiliation,
  index: number,
): string {
  return `<fieldset class="profile-repeat" data-affiliation><legend>Academic institution ${String(index + 1)}</legend><label>Institution name<input name="institutionName" value="${escapeHtml(affiliation.name)}"></label><label>Department<input name="institutionDepartment" value="${escapeHtml(affiliation.department)}"></label><label>Position or programme<input name="institutionPosition" value="${escapeHtml(affiliation.position)}"></label><label>Identifier (for example, ROR)<input name="institutionIdentifier" value="${escapeHtml(affiliation.identifier)}"></label><label>Institution website (HTTPS)<input name="institutionWebsite" value="${escapeHtml(affiliation.website)}"></label><label class="identity-claim__disclosure"><input type="checkbox" name="institutionDisclosure"${checked(affiliation.disclosure)}> Include this affiliation in a selected-claims file</label><button class="profile-button profile-button--quiet" type="button" data-remove-affiliation>Remove institution</button></fieldset>`;
}

function journalView(
  journal: ZenithJournalRelationship,
  index: number,
): string {
  const relationships: ZenithJournalRelationship["relationship"][] = [
    "Author",
    "Editor",
    "Reviewer",
    "Contributor",
  ];
  const options = relationships
    .map(
      (relationship) =>
        `<option${journal.relationship === relationship ? " selected" : ""}>${relationship}</option>`,
    )
    .join("");
  return `<fieldset class="profile-repeat" data-journal><legend>Journal ${String(index + 1)}</legend><label>Journal name<input name="journalName" value="${escapeHtml(journal.name)}"></label><label>Relationship<select name="journalRelationship">${options}</select></label><label>Identifier (for example, ISSN)<input name="journalIdentifier" value="${escapeHtml(journal.identifier)}"></label><label>Journal website (HTTPS)<input name="journalWebsite" value="${escapeHtml(journal.website)}"></label><label class="identity-claim__disclosure"><input type="checkbox" name="journalDisclosure"${checked(journal.disclosure)}> Include this journal relationship in a selected-claims file</label><button class="profile-button profile-button--quiet" type="button" data-remove-journal>Remove journal</button></fieldset>`;
}

function profileValue(
  profile: ZenithIdentitySectionV1,
  name: keyof ZenithIdentityFields,
): string {
  return profile.subject.fields[name].value;
}

function initials(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/u)
    .slice(0, 2)
    .map((part) => Array.from(part)[0] ?? "")
    .join("")
    .toUpperCase();
  return letters || "ME";
}

function selectedClaimCount(profile: ZenithIdentitySectionV1): number {
  const disclosure = selectedIdentityDisclosure(profile, profile.updatedAt);
  return (
    Object.keys(disclosure.claims.fields).length +
    disclosure.claims.roles.length +
    disclosure.claims.affiliations.length +
    disclosure.claims.journals.length
  );
}

function localDate(timestamp: number): string {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime())
    ? "Unknown"
    : date.toISOString().slice(0, 10);
}

function homepageView(
  profile: ZenithIdentitySectionV1,
  membershipActive: boolean,
): string {
  const displayName = profileValue(profile, "displayName") || "Untitled Person";
  const headline =
    profileValue(profile, "headline") ||
    "A private person finding their place in the Castalia commons.";
  const biography =
    profileValue(profile, "biography") ||
    "This is your corner of Castalia. Add an introduction when you are ready.";
  const website = profileValue(profile, "website");
  const orcid = profileValue(profile, "orcid");
  const roles = profile.subject.roles.length
    ? profile.subject.roles
        .map(({ role }) => `<li>${escapeHtml(role)}</li>`)
        .join("")
    : '<li class="homepage-empty">No roles listed yet.</li>';
  const affiliations = profile.subject.affiliations.length
    ? profile.subject.affiliations
        .map(
          ({ name, department, position, website: affiliationWebsite }) =>
            `<li><strong>${escapeHtml(name || "Unnamed institution")}</strong>${department ? `<span>${escapeHtml(department)}</span>` : ""}${position ? `<span>${escapeHtml(position)}</span>` : ""}${affiliationWebsite ? `<a href="${escapeHtml(affiliationWebsite)}" rel="noreferrer">Visit institution</a>` : ""}</li>`,
        )
        .join("")
    : '<li class="homepage-empty">No academic affiliations listed yet.</li>';
  const journals = profile.subject.journals.length
    ? profile.subject.journals
        .map(
          ({ name, relationship, website: journalWebsite }) =>
            `<li><strong>${escapeHtml(name || "Unnamed journal")}</strong><span>${escapeHtml(relationship)}</span>${journalWebsite ? `<a href="${escapeHtml(journalWebsite)}" rel="noreferrer">Visit journal</a>` : ""}</li>`,
        )
        .join("")
    : '<li class="homepage-empty">No journal relationships listed yet.</li>';
  const selected = selectedClaimCount(profile);
  const updated = localDate(profile.updatedAt);
  const memberKey = profile.subject.memberKey;
  const publicLinks = [
    website
      ? `<a href="${escapeHtml(website)}" rel="noreferrer">My website</a>`
      : "",
    orcid
      ? `<a href="https://orcid.org/${escapeHtml(orcid)}" rel="noreferrer">ORCID ${escapeHtml(orcid)}</a>`
      : "",
  ]
    .filter(Boolean)
    .join('<span aria-hidden="true"> · </span>');

  return `<section class="homepage-window" aria-labelledby="homepage-name"><div class="homepage-titlebar"><span>castalia://person/${escapeHtml(memberKey.slice(0, 12))}</span><span>PRIVATE LOCAL COPY</span></div><div class="homepage-address"><span aria-hidden="true">⌂</span><span>My Castalia / ${escapeHtml(displayName)}</span><span class="homepage-led" title="Encrypted vault available"></span></div><header class="homepage-hero"><div class="homepage-avatar" aria-hidden="true"><span>${escapeHtml(initials(displayName))}</span></div><div><p class="homepage-welcome">Welcome to my Castalia</p><h2 id="homepage-name">${escapeHtml(displayName)}</h2><p>${escapeHtml(headline)}</p>${publicLinks ? `<p class="homepage-links">${publicLinks}</p>` : ""}</div></header><nav class="homepage-index" aria-label="My Castalia page index"><span>Page index:</span><a href="#my-about">About</a><a href="#my-roles">Roles</a><a href="#my-places">Institutions</a><a href="#my-journals">Journals</a><a href="#identity-editor">Edit page</a><a href="#my-vault">Vault</a></nav><div class="homepage-grid"><main class="homepage-content"><section id="my-about" class="homepage-panel homepage-about"><p class="homepage-marker">01 / ABOUT.TXT</p><h3>About me</h3><p>${escapeHtml(biography)}</p></section><section id="my-places" class="homepage-panel"><p class="homepage-marker">02 / PLACES.HTML</p><h3>Academic institutions</h3><ul class="homepage-records">${affiliations}</ul></section><section id="my-journals" class="homepage-panel"><p class="homepage-marker">03 / JOURNALS.HTML</p><h3>Journal desk</h3><ul class="homepage-records">${journals}</ul></section></main><aside class="homepage-sidebar"><section id="my-roles" class="homepage-panel"><p class="homepage-marker">WHOAMI</p><h3>Person</h3><ul class="homepage-role-list">${roles}</ul></section><section class="homepage-panel homepage-status"><p class="homepage-marker">STATUS.LOG</p><dl><div><dt>Keypair</dt><dd>Ready</dd></div><div><dt>Membership</dt><dd>${membershipActive ? "Active" : '<a href="/start">Not issued</a>'}</dd></div><div><dt>Selected claims</dt><dd>${String(selected)}</dd></div><div><dt>Last local save</dt><dd>${escapeHtml(updated)}</dd></div></dl></section><section class="homepage-panel homepage-privacy"><p class="homepage-marker">ROBOTS.TXT</p><h3>Private by default</h3><p>This page is an on-device preview. Nothing here is published or sent to a server.</p></section></aside></div><footer class="homepage-footer"><span>Zenith Ontology: Person</span><span>Member Key ${escapeHtml(memberKey.slice(0, 10))}&hellip;${escapeHtml(memberKey.slice(-6))}</span><span>Best viewed with curiosity</span></footer></section>`;
}

function profileEditor(profile: ZenithIdentitySectionV1): string {
  const fields = FIELD_LABELS.map(({ name, label, kind, autocomplete }) =>
    fieldView(
      name,
      label,
      kind,
      profile.subject.fields[name].value,
      profile.subject.fields[name].disclosure,
      autocomplete,
    ),
  ).join("");
  const roles = ZENITH_PERSON_ROLES.map((role) => {
    const existing = profile.subject.roles.find((claim) => claim.role === role);
    return `<div class="profile-role"><label><input type="checkbox" name="role-${role}"${existing ? " checked" : ""}> ${role}</label><label class="identity-claim__disclosure"><input type="checkbox" name="role-${role}-disclosure"${checked(existing?.disclosure ?? "private")}${existing ? "" : " disabled"}> Include role in selected claims</label></div>`;
  }).join("");
  const affiliations = profile.subject.affiliations
    .map(affiliationView)
    .join("");
  const journals = profile.subject.journals.map(journalView).join("");
  return `<form id="identity-editor" class="profile-form" data-profile-form><header class="profile-control-header"><p class="profile-kicker">Webmaster desk / private</p><h2>Edit My Castalia</h2><p>Write your personal page in Zenith's ontology. Every field stays inside the encrypted identity section unless its sharing box is selected and you deliberately create a selected-claims file.</p></header><section class="profile-section" aria-labelledby="profile-person-heading"><div class="profile-section__titlebar"><span>person.properties</span><span>SELF-ASSERTED</span></div><div class="profile-section__body"><p class="profile-kicker">Zenith Ontology</p><h3 id="profile-person-heading">Person</h3><div class="profile-field-grid">${fields}</div></div></section><section class="profile-section" aria-labelledby="profile-roles-heading"><div class="profile-section__titlebar"><span>roles.list</span><span>OPTIONAL</span></div><div class="profile-section__body"><h3 id="profile-roles-heading">Roles</h3><p>A Person may also describe themself as an Author, Researcher, or Student. Roles do not grant permissions.</p><div class="profile-role-grid">${roles}</div></div></section><section class="profile-section" aria-labelledby="profile-institutions-heading"><div class="profile-section__titlebar"><span>institutions.list</span><span>0–12</span></div><div class="profile-section__body"><h3 id="profile-institutions-heading">Academic institutions</h3><p>Institutions are organization affiliations, not kinds of Person.</p><div data-affiliations>${affiliations}</div><button class="profile-button profile-button--quiet" type="button" data-add-affiliation>Add institution</button></div></section><section class="profile-section" aria-labelledby="profile-journals-heading"><div class="profile-section__titlebar"><span>journals.list</span><span>0–24</span></div><div class="profile-section__body"><h3 id="profile-journals-heading">Journals</h3><p>Record a relationship to a journal without claiming that the journal verified it.</p><div data-journals>${journals}</div><button class="profile-button profile-button--quiet" type="button" data-add-journal>Add journal</button></div></section><div class="profile-actions"><button class="profile-button" type="submit">Save My Castalia</button><button class="profile-button profile-button--quiet" type="button" data-download-disclosure>Create selected-claims file</button></div></form>`;
}

function emptyAffiliation(): ZenithAcademicInstitutionAffiliation {
  return {
    type: "AcademicInstitution",
    name: "",
    department: "",
    position: "",
    identifier: "",
    website: "",
    disclosure: "private",
  };
}

function emptyJournal(): ZenithJournalRelationship {
  return {
    type: "Journal",
    name: "",
    relationship: "Author",
    identifier: "",
    website: "",
    disclosure: "private",
  };
}

function download(name: string, contents: string, type = "application/json") {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function profileView(dependencies: ProfileDependencies): View {
  const webWalletSession = dependencies.webWalletSession;
  const element = elementFromHtml(
    `<article class="profile-page"><header class="profile-header"><p class="profile-kicker">Personal home service / local-first</p><h1>My Castalia</h1><p>Your keypair opens a private corner of Castalia. Build a Person page, keep it in the encrypted <code>.castaway</code> identity section, and choose each claim that may leave your wallet.</p><div class="profile-header__rule" aria-hidden="true"><span>✦</span><span>✦</span><span>✦</span></div></header><div data-profile-status></div></article>`,
  );
  const host = element.querySelector<HTMLElement>("[data-profile-status]");
  let profile: ZenithIdentitySectionV1 | null = null;
  let notice = "";
  let busy = false;
  let destroyed = false;

  const requiredInput = (
    root: ParentNode,
    selector: string,
  ): HTMLInputElement => {
    const input = root.querySelector<HTMLInputElement>(selector);
    if (!input) throw new Error("profile field is unavailable");
    return input;
  };

  const readProfile = (): ZenithIdentitySectionV1 => {
    if (!profile) throw new Error("profile is unavailable");
    const form = element.querySelector<HTMLFormElement>("[data-profile-form]");
    if (!form) throw new Error("profile form is unavailable");
    const fields = Object.fromEntries(
      FIELD_LABELS.map(({ name }) => [
        name,
        {
          value: requiredInput(form, `[name="${name}"]`).value.trim(),
          disclosure: requiredInput(form, `[name="${name}Disclosure"]`).checked
            ? "selected"
            : "private",
        },
      ]),
    ) as ZenithIdentityFields;
    const roles = ZENITH_PERSON_ROLES.flatMap((role) =>
      requiredInput(form, `[name="role-${role}"]`).checked
        ? [
            {
              role,
              disclosure: requiredInput(
                form,
                `[name="role-${role}-disclosure"]`,
              ).checked
                ? ("selected" as const)
                : ("private" as const),
            },
          ]
        : [],
    );
    const affiliations = Array.from(
      form.querySelectorAll<HTMLElement>("[data-affiliation]"),
      (row): ZenithAcademicInstitutionAffiliation => ({
        type: "AcademicInstitution",
        name: requiredInput(row, '[name="institutionName"]').value.trim(),
        department: requiredInput(
          row,
          '[name="institutionDepartment"]',
        ).value.trim(),
        position: requiredInput(
          row,
          '[name="institutionPosition"]',
        ).value.trim(),
        identifier: requiredInput(
          row,
          '[name="institutionIdentifier"]',
        ).value.trim(),
        website: requiredInput(row, '[name="institutionWebsite"]').value.trim(),
        disclosure: requiredInput(row, '[name="institutionDisclosure"]').checked
          ? "selected"
          : "private",
      }),
    ).filter(({ name, department, position, identifier, website }) =>
      Boolean(name || department || position || identifier || website),
    );
    const journals = Array.from(
      form.querySelectorAll<HTMLElement>("[data-journal]"),
      (row): ZenithJournalRelationship => ({
        type: "Journal",
        name: requiredInput(row, '[name="journalName"]').value.trim(),
        relationship: requiredInput(row, '[name="journalRelationship"]')
          .value as ZenithJournalRelationship["relationship"],
        identifier: requiredInput(
          row,
          '[name="journalIdentifier"]',
        ).value.trim(),
        website: requiredInput(row, '[name="journalWebsite"]').value.trim(),
        disclosure: requiredInput(row, '[name="journalDisclosure"]').checked
          ? "selected"
          : "private",
      }),
    ).filter(({ name, identifier, website }) =>
      Boolean(name || identifier || website),
    );
    return parseZenithIdentitySection({
      ...profile,
      subject: { ...profile.subject, fields, roles, affiliations, journals },
      updatedAt: Date.now(),
    });
  };

  const run = async (operation: () => Promise<void>) => {
    if (busy) return;
    busy = true;
    try {
      await operation();
    } catch (error) {
      notice = message(error);
    } finally {
      busy = false;
      if (!destroyed) await render();
    }
  };

  const wireEditor = () => {
    if (!webWalletSession) return;
    const form = element.querySelector<HTMLFormElement>("[data-profile-form]");
    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      void run(async () => {
        profile = await webWalletSession.saveIdentityProfile(readProfile());
        notice = "Private profile saved inside the encrypted identity section.";
        dependencies.onWalletChanged();
      });
    });
    for (const role of ZENITH_PERSON_ROLES) {
      const roleControl = form?.querySelector<HTMLInputElement>(
        `[name="role-${role}"]`,
      );
      const disclosureControl = form?.querySelector<HTMLInputElement>(
        `[name="role-${role}-disclosure"]`,
      );
      roleControl?.addEventListener("change", () => {
        if (!disclosureControl) return;
        disclosureControl.disabled = !roleControl.checked;
        if (!roleControl.checked) disclosureControl.checked = false;
      });
    }
    element
      .querySelector<HTMLButtonElement>("[data-add-affiliation]")
      ?.addEventListener("click", () => {
        profile = readProfile();
        profile.subject.affiliations.push(emptyAffiliation());
        void render();
      });
    element
      .querySelector<HTMLButtonElement>("[data-add-journal]")
      ?.addEventListener("click", () => {
        profile = readProfile();
        profile.subject.journals.push(emptyJournal());
        void render();
      });
    for (const [index, button] of Array.from(
      element.querySelectorAll<HTMLButtonElement>("[data-remove-affiliation]"),
    ).entries())
      button.addEventListener("click", () => {
        profile = readProfile();
        profile.subject.affiliations.splice(index, 1);
        void render();
      });
    for (const [index, button] of Array.from(
      element.querySelectorAll<HTMLButtonElement>("[data-remove-journal]"),
    ).entries())
      button.addEventListener("click", () => {
        profile = readProfile();
        profile.subject.journals.splice(index, 1);
        void render();
      });
    element
      .querySelector<HTMLButtonElement>("[data-download-disclosure]")
      ?.addEventListener("click", () => {
        void run(async () => {
          const candidate = readProfile();
          profile = await webWalletSession.saveIdentityProfile(candidate);
          const disclosure = selectedIdentityDisclosure(candidate);
          const selectedCount =
            Object.keys(disclosure.claims.fields).length +
            disclosure.claims.roles.length +
            disclosure.claims.affiliations.length +
            disclosure.claims.journals.length;
          if (selectedCount === 0)
            throw new Error(
              "Select at least one claim before creating a disclosure",
            );
          download(
            `Castalia-Selected-Claims-${String(Date.now())}.json`,
            JSON.stringify(disclosure, null, 2),
          );
          notice = `Downloaded ${String(selectedCount)} selected self-asserted claim${selectedCount === 1 ? "" : "s"}. Nothing was uploaded.`;
        });
      });
  };

  const render = async () => {
    if (!host || destroyed) return;
    const snapshot = webWalletSession
      ? await webWalletSession.snapshot()
      : {
          state: "empty" as const,
          identity: null,
          backupConfirmed: false,
          membership: null,
          profileAvailable: false,
        };
    const status = notice
      ? `<p class="profile-notice" role="status">${escapeHtml(notice)}</p>`
      : "";
    if (!snapshot.identity) {
      const extension = dependencies.getWalletProvider();
      if (extension) {
        const extensionStatus = await extension.getStatus();
        const publicIdentity = extensionStatus.publicIdentity?.trim();
        const keypairAvailable =
          extensionStatus.state === "ready" || Boolean(publicIdentity);
        if (keypairAvailable) {
          host.innerHTML = `${status}<section class="homepage-window homepage-window--gate"><div class="homepage-titlebar"><span>castalia://wallet-extension</span><span>KEYPAIR READY</span></div><div class="profile-gate"><p class="profile-kicker">My Castalia found</p><h2>Your personal page begins here.</h2><p>Castalia can see that your extension has a keypair${publicIdentity ? ` <code>${escapeHtml(publicIdentity.slice(0, 18))}&hellip;</code>` : ""}. This extension version does not yet expose its encrypted <code>.castaway</code> identity section to the site, so editing remains inside Castalia Web's own wallet for now.</p><a class="profile-button" href="/start">Open wallet options</a></div></section>`;
          return;
        }
      }
      host.innerHTML = `${status}<section class="homepage-window homepage-window--gate"><div class="homepage-titlebar"><span>castalia://new-person</span><span>NO KEYPAIR</span></div><div class="profile-gate"><p class="profile-kicker">A blank page on the old web</p><h2>Claim your corner of Castalia.</h2><p>Create or restore a wallet keypair first. Membership can come afterward; My Castalia belongs to the identity, not to a browser login session.</p><a class="profile-button" href="/start">Create my keypair</a></div></section>`;
      return;
    }
    if (!webWalletSession)
      throw new Error("browser wallet session is unavailable");
    if (snapshot.state === "locked") {
      host.innerHTML = `${status}<section class="homepage-window homepage-window--gate"><div class="homepage-titlebar"><span>castalia://person/${escapeHtml(snapshot.identity.ownerPublicKey.slice(0, 12))}</span><span>${snapshot.membership ? "MEMBER" : "KEYPAIR READY"}</span></div><div class="profile-gate"><p class="profile-kicker">My Castalia / encrypted</p><h2>Unlock your personal page.</h2><p>The public keypair is available, so this link replaces Join. Your private Person profile remains unreadable until you unlock the wallet.</p><form data-profile-unlock><label>Wallet passphrase<input name="passphrase" type="password" autocomplete="current-password" required></label><button class="profile-button" type="submit">Unlock My Castalia</button></form><p class="profile-keyline">Member Key <code>${escapeHtml(snapshot.identity.ownerPublicKey)}</code></p></div></section>`;
      host
        .querySelector<HTMLFormElement>("[data-profile-unlock]")
        ?.addEventListener("submit", (event) => {
          event.preventDefault();
          void run(async () => {
            const form = event.currentTarget as HTMLFormElement;
            await webWalletSession.unlock(
              requiredInput(form, '[name="passphrase"]').value,
            );
            profile = await webWalletSession.identityProfile();
            notice = "My Castalia unlocked for this tab.";
            dependencies.onWalletChanged();
          });
        });
      return;
    }
    profile ??= await webWalletSession.identityProfile();
    host.innerHTML = `${status}${homepageView(profile, Boolean(snapshot.membership))}${profileEditor(profile)}<section id="my-vault" class="profile-section profile-portability" aria-labelledby="profile-vault-heading"><div class="profile-section__titlebar"><span>castaway.vault</span><span>PORTABLE</span></div><div class="profile-section__body"><p class="profile-kicker">My files</p><h2 id="profile-vault-heading">Portable identity vault</h2><p><code>.castaway</code> carries this encrypted identity section between compatible wallet apps. It does not contain your signing key and does not create membership.</p><div class="profile-portability__grid"><form data-castaway-export><h3>Export identity vault</h3><label>Vault passphrase<input name="passphrase" type="password" minlength="12" autocomplete="new-password" required></label><label>Confirm vault passphrase<input name="confirmation" type="password" minlength="12" autocomplete="new-password" required></label><button class="profile-button" type="submit">Download .castaway</button></form><form data-castaway-import><h3>Import identity vault</h3><label>Castaway file<input name="file" type="file" accept=".castaway,application/json" required></label><label>Vault passphrase<input name="passphrase" type="password" autocomplete="current-password" required></label><button class="profile-button" type="submit">Import .castaway</button></form></div><button class="profile-button profile-button--quiet" type="button" data-profile-lock>Lock My Castalia</button></div></section>`;
    wireEditor();
    host
      .querySelector<HTMLFormElement>("[data-castaway-export]")
      ?.addEventListener("submit", (event) => {
        event.preventDefault();
        void run(async () => {
          profile = await webWalletSession.saveIdentityProfile(readProfile());
          const form = event.currentTarget as HTMLFormElement;
          const passphrase = requiredInput(form, '[name="passphrase"]');
          const confirmation = requiredInput(form, '[name="confirmation"]');
          if (passphrase.value.length < 12)
            throw new Error("Use a vault passphrase of at least 12 characters");
          if (passphrase.value !== confirmation.value)
            throw new Error("Vault passphrases do not match");
          const encrypted = await webWalletSession.exportCastaway(
            passphrase.value,
          );
          download(
            `Castalia-Identity-${String(Date.now())}.castaway`,
            encrypted,
          );
          notice = "Encrypted .castaway identity vault downloaded.";
        });
      });
    host
      .querySelector<HTMLFormElement>("[data-castaway-import]")
      ?.addEventListener("submit", (event) => {
        event.preventDefault();
        void run(async () => {
          const form = event.currentTarget as HTMLFormElement;
          const file = requiredInput(form, '[name="file"]').files?.[0];
          if (!file) throw new Error("Choose a .castaway file");
          if (file.size > 1_048_576)
            throw new Error("Castaway file exceeds the 1 MiB limit");
          profile = await webWalletSession.importCastaway(
            await file.text(),
            requiredInput(form, '[name="passphrase"]').value,
          );
          notice = "Encrypted identity section imported for this Member Key.";
          dependencies.onWalletChanged();
        });
      });
    host
      .querySelector<HTMLButtonElement>("[data-profile-lock]")
      ?.addEventListener("click", () => {
        void run(async () => {
          await webWalletSession.lock();
          profile = null;
          notice = "My Castalia locked.";
          dependencies.onWalletChanged();
        });
      });
  };

  const onVisibility = () => {
    if (document.visibilityState !== "hidden") return;
    if (!webWalletSession) return;
    void webWalletSession.lock().then(() => {
      profile = null;
      dependencies.onWalletChanged();
      return render();
    });
  };
  document.addEventListener("visibilitychange", onVisibility);
  void render().catch((error: unknown) => {
    if (host)
      host.innerHTML = `<p class="profile-notice" role="alert">${escapeHtml(message(error))}</p>`;
  });
  return {
    element,
    destroy() {
      destroyed = true;
      document.removeEventListener("visibilitychange", onVisibility);
    },
  };
}
