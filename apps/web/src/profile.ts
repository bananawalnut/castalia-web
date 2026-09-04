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
  webWalletSession: WebWalletSession;
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
  return `<form class="profile-form" data-profile-form><section class="profile-section" aria-labelledby="profile-person-heading"><p class="profile-kicker">Zenith Ontology</p><h2 id="profile-person-heading">Person</h2><p>These are self-asserted claims. They remain private inside your encrypted vault unless you deliberately export selected claims.</p><div class="profile-field-grid">${fields}</div></section><section class="profile-section" aria-labelledby="profile-roles-heading"><h2 id="profile-roles-heading">Roles</h2><p>A Person may also describe themself as an Author, Researcher, or Student. Roles do not grant permissions.</p><div class="profile-role-grid">${roles}</div></section><section class="profile-section" aria-labelledby="profile-institutions-heading"><h2 id="profile-institutions-heading">Academic institutions</h2><p>Institutions are organization affiliations, not kinds of Person.</p><div data-affiliations>${affiliations}</div><button class="profile-button profile-button--quiet" type="button" data-add-affiliation>Add institution</button></section><section class="profile-section" aria-labelledby="profile-journals-heading"><h2 id="profile-journals-heading">Journals</h2><p>Record a relationship to a journal without claiming that the journal verified it.</p><div data-journals>${journals}</div><button class="profile-button profile-button--quiet" type="button" data-add-journal>Add journal</button></section><div class="profile-actions"><button class="profile-button" type="submit">Save private profile</button><button class="profile-button profile-button--quiet" type="button" data-download-disclosure>Download selected claims</button></div></form>`;
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
  const element = elementFromHtml(
    `<article class="profile-page"><header class="profile-header"><p class="profile-kicker">Private identity</p><h1>Profile</h1><p>Your profile is a Zenith-typed identity section in this browser wallet's encrypted <code>.castaway</code> vault.</p></header><div data-profile-status></div></article>`,
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
    const form = element.querySelector<HTMLFormElement>("[data-profile-form]");
    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      void run(async () => {
        profile =
          await dependencies.webWalletSession.saveIdentityProfile(
            readProfile(),
          );
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
          profile =
            await dependencies.webWalletSession.saveIdentityProfile(candidate);
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
    const snapshot = await dependencies.webWalletSession.snapshot();
    const status = notice
      ? `<p class="profile-notice" role="status">${escapeHtml(notice)}</p>`
      : "";
    if (!snapshot.membership) {
      const extension = dependencies.getWalletProvider();
      if (extension) {
        host.innerHTML = `${status}<section class="profile-gate"><h2>Wallet profile unavailable</h2><p>This extension can prove membership, but it does not yet expose the <code>.castaway</code> identity-section interface to Castalia Web.</p><a class="profile-button" href="/start">Open wallet options</a></section>`;
      } else {
        host.innerHTML = `${status}<section class="profile-gate"><h2>Membership required</h2><p>Create or restore a wallet and issue its Castalia membership before creating a profile.</p><a class="profile-button" href="/start">Join Castalia</a></section>`;
      }
      return;
    }
    if (snapshot.state === "locked") {
      host.innerHTML = `${status}<section class="profile-gate"><p class="profile-kicker">Member ${escapeHtml(snapshot.identity?.ownerPublicKey.slice(0, 12) ?? "")}&hellip;</p><h2>Unlock your private profile</h2><p>The profile is encrypted with this wallet identity and cannot be read while the wallet is locked.</p><form data-profile-unlock><label>Wallet passphrase<input name="passphrase" type="password" autocomplete="current-password" required></label><button class="profile-button" type="submit">Unlock profile</button></form></section>`;
      host
        .querySelector<HTMLFormElement>("[data-profile-unlock]")
        ?.addEventListener("submit", (event) => {
          event.preventDefault();
          void run(async () => {
            const form = event.currentTarget as HTMLFormElement;
            await dependencies.webWalletSession.unlock(
              requiredInput(form, '[name="passphrase"]').value,
            );
            profile = await dependencies.webWalletSession.identityProfile();
            notice = "Private profile unlocked for this tab.";
            dependencies.onWalletChanged();
          });
        });
      return;
    }
    profile ??= await dependencies.webWalletSession.identityProfile();
    host.innerHTML = `${status}<div class="profile-member-binding"><span>Active Member Key</span><code>${escapeHtml(profile.subject.memberKey)}</code></div>${profileEditor(profile)}<section class="profile-section profile-portability" aria-labelledby="profile-vault-heading"><h2 id="profile-vault-heading">Portable vault</h2><p><code>.castaway</code> carries this encrypted identity section between compatible wallet apps. It does not contain your signing key and does not create membership.</p><div class="profile-portability__grid"><form data-castaway-export><h3>Export identity vault</h3><label>Vault passphrase<input name="passphrase" type="password" minlength="12" autocomplete="new-password" required></label><label>Confirm vault passphrase<input name="confirmation" type="password" minlength="12" autocomplete="new-password" required></label><button class="profile-button" type="submit">Download .castaway</button></form><form data-castaway-import><h3>Import identity vault</h3><label>Castaway file<input name="file" type="file" accept=".castaway,application/json" required></label><label>Vault passphrase<input name="passphrase" type="password" autocomplete="current-password" required></label><button class="profile-button" type="submit">Import .castaway</button></form></div><button class="profile-button profile-button--quiet" type="button" data-profile-lock>Lock wallet</button></section>`;
    wireEditor();
    host
      .querySelector<HTMLFormElement>("[data-castaway-export]")
      ?.addEventListener("submit", (event) => {
        event.preventDefault();
        void run(async () => {
          profile =
            await dependencies.webWalletSession.saveIdentityProfile(
              readProfile(),
            );
          const form = event.currentTarget as HTMLFormElement;
          const passphrase = requiredInput(form, '[name="passphrase"]');
          const confirmation = requiredInput(form, '[name="confirmation"]');
          if (passphrase.value.length < 12)
            throw new Error("Use a vault passphrase of at least 12 characters");
          if (passphrase.value !== confirmation.value)
            throw new Error("Vault passphrases do not match");
          const encrypted = await dependencies.webWalletSession.exportCastaway(
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
          profile = await dependencies.webWalletSession.importCastaway(
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
          await dependencies.webWalletSession.lock();
          profile = null;
          notice = "Wallet locked.";
          dependencies.onWalletChanged();
        });
      });
  };

  const onVisibility = () => {
    if (document.visibilityState !== "hidden") return;
    void dependencies.webWalletSession.lock().then(() => {
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
