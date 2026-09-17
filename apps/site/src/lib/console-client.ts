import type { ConsolePayload, ConsolePlanPayload, ConsoleRoutePayload } from "./console-data.ts"
import { formatTasksPerMonth, formatUsd, MISSING } from "./format.ts"
import { readoutAttributes, type ReadoutFields } from "./readout.ts"

// The browser decodes the same payload the server module writes; these are its short names.
type ConsolePlan = ConsolePlanPayload

type ConsoleRoute = ConsoleRoutePayload

export function initConsole(): void {
  interface ConsoleState {
    planId: string
    modelIds: string[]
    tasks: number
  }

  const dataNode = document.getElementById("console-data")

  // SAFETY: the server-rendered overview always emits this native control.
  const planSelect = document.getElementById("console-plan") as HTMLSelectElement

  // SAFETY: the server-rendered overview always emits this native control group.
  const modelOptions = document.getElementById("console-model-options") as HTMLFieldSetElement

  // SAFETY: the server-rendered overview always emits this status node.
  const modelEmpty = document.getElementById("console-model-empty") as HTMLElement

  // SAFETY: the server-rendered overview always emits this native input.
  const tasksInput = document.getElementById("console-tasks") as HTMLInputElement

  // SAFETY: the server-rendered overview always emits this native button.
  const resetButton = document.getElementById("console-reset") as HTMLButtonElement

  // SAFETY: the server-rendered overview always emits this listing body.
  const rowsBody = document.getElementById("console-results") as HTMLElement

  // SAFETY: the server-rendered overview always emits this empty-state node.
  const emptyState = document.getElementById("console-empty-state") as HTMLElement

  // SAFETY: the server-rendered overview always emits this route-count node.
  const routeCount = document.getElementById("console-route-count") as HTMLElement

  // SAFETY: the server-rendered overview always emits this row template.
  const rowTemplate = document.getElementById("console-row-template") as HTMLTemplateElement

  // SAFETY: the server-rendered overview always emits this model template.
  const modelTemplate = document.getElementById("console-model-template") as HTMLTemplateElement

  if (
    dataNode !== null &&
    planSelect instanceof HTMLSelectElement &&
    modelOptions instanceof HTMLFieldSetElement &&
    modelEmpty instanceof HTMLElement &&
    tasksInput instanceof HTMLInputElement &&
    resetButton instanceof HTMLButtonElement &&
    rowsBody instanceof HTMLElement &&
    emptyState instanceof HTMLElement &&
    routeCount instanceof HTMLElement &&
    rowTemplate instanceof HTMLTemplateElement &&
    modelTemplate instanceof HTMLTemplateElement
  ) {
    const encoded = dataNode.textContent

    if (encoded === null) {
      throw new Error("Homepage console payload is empty")
    }

    // SAFETY: this string is written by this page's own frontmatter in the same
    // build, so no external producer can reach this client decoder.
    const payload = JSON.parse(encoded) as ConsolePayload
    const planById = new Map(payload.plans.map((plan) => [plan.planId, plan]))

    const fallbackFields = (plan: ConsolePlan): ReadoutFields => ({
      value: MISSING,
      basis: MISSING,
      confidence: MISSING,
      source:
        plan.routes.length === 0
          ? "No committed rows for this view."
          : "No rows match the current filters.",
      retrieved: plan.retrievedAt,
    })

    const setReadoutAttributes = (node: HTMLElement, fields: ReadoutFields): void => {
      for (const [name, value] of Object.entries(readoutAttributes(fields))) {
        node.setAttribute(name, value)
      }
    }

    const validRoute = (route: ConsoleRoute): boolean =>
      Number.isFinite(route.tasksPerMonth) &&
      route.tasksPerMonth > 0 &&
      Number.isFinite(route.apiCostPerTaskUsd)

    const defaultForPlan = (plan: ConsolePlan): string | null => {
      const measured =
        plan.measuredAgainstModel === null
          ? undefined
          : plan.routes.find((route) => route.modelId === plan.measuredAgainstModel)

      if (measured !== undefined && validRoute(measured)) {
        return measured.modelId
      }

      let cheapest: ConsoleRoute | undefined

      for (const route of plan.routes) {
        if (!validRoute(route)) {
          continue
        }

        if (cheapest === undefined || route.apiCostPerTaskUsd < cheapest.apiCostPerTaskUsd) {
          cheapest = route
        }
      }

      return cheapest?.modelId ?? null
    }

    const canonicalModelIds = (plan: ConsolePlan, requested: string[] | null): string[] => {
      if (requested === null) {
        const defaultModel = defaultForPlan(plan)

        return defaultModel === null ? [] : [defaultModel]
      }

      const requestedSet = new Set(requested)

      return plan.routes
        .filter((route) => requestedSet.has(route.modelId))
        .map((route) => route.modelId)
    }

    const readState = (): ConsoleState => {
      const params = new URLSearchParams(window.location.search)
      const requestedPlan = params.get("plan")

      const plan =
        requestedPlan !== null && planById.has(requestedPlan)
          ? planById.get(requestedPlan)
          : planById.get(payload.defaultPlanId)

      if (plan === undefined) {
        throw new Error("Homepage console has no default plan in payload")
      }

      const requestedModels = params.has("models")
        ? (params.get("models") ?? "").split(",").filter(Boolean)
        : null

      const rawTasks = params.get("tasks")
      const requestedTasks = rawTasks === null ? Number.NaN : Number(rawTasks)

      const tasks =
        Number.isFinite(requestedTasks) && requestedTasks >= 0
          ? requestedTasks
          : payload.defaultTasks

      const matchedModelIds = canonicalModelIds(plan, requestedModels)

      return {
        planId: plan.planId,
        modelIds: matchedModelIds,
        tasks,
      }
    }

    const selectedPlan = (state: ConsoleState): ConsolePlan => {
      const plan = planById.get(state.planId)

      if (plan === undefined) {
        throw new Error(`Homepage console cannot resolve plan ${state.planId}`)
      }

      return plan
    }

    const writeUrl = (state: ConsoleState): void => {
      const url = new URL(window.location.href)
      url.searchParams.set("plan", state.planId)
      url.searchParams.set("models", state.modelIds.join(","))
      url.searchParams.set("tasks", String(state.tasks))
      history.replaceState(null, "", url)
    }

    const setModelControls = (plan: ConsolePlan, selected: readonly string[]): void => {
      modelOptions.replaceChildren()
      const selectedSet = new Set(selected)

      for (const route of plan.routes) {
        const fragment = document.importNode(modelTemplate.content, true)
        const label = fragment.querySelector("label")

        if (!(label instanceof HTMLLabelElement)) {
          throw new Error("Homepage console model template has no label")
        }

        const input = label.querySelector("[data-console-model-input]")
        const name = label.querySelector("[data-console-model-name]")

        if (!(input instanceof HTMLInputElement) || !(name instanceof HTMLElement)) {
          throw new Error("Homepage console model template is incomplete")
        }

        input.id = `console-model-${route.modelId}`
        input.value = route.modelId
        input.checked = selectedSet.has(route.modelId)
        label.htmlFor = input.id
        name.textContent = route.modelName
        modelOptions.append(fragment)
      }

      modelOptions.hidden = plan.routes.length === 0
      modelEmpty.classList.toggle("hidden", plan.routes.length > 0)
    }

    const renderRows = (state: ConsoleState, shouldPointReadout: boolean): void => {
      const plan = selectedPlan(state)
      const selectedSet = new Set(state.modelIds)
      const liveRoutes = plan.routes.filter((route) => selectedSet.has(route.modelId))
      rowsBody.replaceChildren()

      for (const [index, route] of liveRoutes.entries()) {
        if (!validRoute(route)) {
          throw new Error(
            `Homepage console route ${plan.planId}/${route.modelId} has incomplete priced-route inputs`,
          )
        }

        const fragment = document.importNode(rowTemplate.content, true)
        const row = fragment.querySelector("tr")

        if (!(row instanceof HTMLTableRowElement)) {
          throw new Error("Homepage console row template has no table row")
        }

        const costNode = row.querySelector("[data-console-cost]")
        const breakEvenNode = row.querySelector("[data-console-break-even]")
        const planName = row.querySelector("[data-console-plan-name]")
        const provider = row.querySelector("[data-console-plan-provider]")
        const modelLink = row.querySelector("[data-console-model-link]")
        const lineLabel = row.querySelector("[data-console-line-label]")

        if (
          !(costNode instanceof HTMLElement) ||
          !(breakEvenNode instanceof HTMLElement) ||
          !(planName instanceof HTMLElement) ||
          !(provider instanceof HTMLElement) ||
          !(modelLink instanceof HTMLAnchorElement) ||
          !(lineLabel instanceof HTMLElement)
        ) {
          throw new Error("Homepage console row template is incomplete")
        }

        const cost =
          state.tasks <= route.tasksPerMonth
            ? route.priceUsdMonth
            : route.priceUsdMonth + (state.tasks - route.tasksPerMonth) * route.apiCostPerTaskUsd

        const breakEven = route.priceUsdMonth / route.apiCostPerTaskUsd

        const fields: ReadoutFields = {
          value: formatUsd(cost),
          basis: "API list",
          confidence: plan.confidence,
          source: plan.provider,
          retrieved: plan.retrievedAt,
        }

        row.id = `route-${plan.planId}-${route.modelId}`
        setReadoutAttributes(row, fields)
        planName.textContent = plan.planName
        provider.textContent = plan.provider

        const modelHrefBase = modelLink.getAttribute("href")

        if (modelHrefBase === null) {
          throw new Error("Homepage console model template has no model route base")
        }

        modelLink.setAttribute("href", `${modelHrefBase}${route.modelId}/`)
        modelLink.textContent = route.modelName
        costNode.textContent = fields.value
        breakEvenNode.textContent =
          breakEven <= route.tasksPerMonth
            ? formatTasksPerMonth(breakEven)
            : "Never breaks even at list rates"
        lineLabel.textContent = `Line ${String(index + 1).padStart(2, "0")}`
        rowsBody.append(fragment)
      }

      routeCount.textContent = String(liveRoutes.length)
      const hasRows = liveRoutes.length > 0

      emptyState.classList.toggle("hidden", hasRows)

      if (!hasRows) {
        setReadoutAttributes(emptyState, fallbackFields(plan))

        const message =
          plan.routes.length === 0
            ? "No committed rows for this view."
            : "No rows match the current filters."

        const messageNode = emptyState.querySelector<HTMLElement>("[data-state]")

        if (messageNode !== null) {
          messageNode.textContent = message
        }
      }

      if (shouldPointReadout) {
        const firstRow = rowsBody.querySelector<HTMLElement>("[data-readout]")
        const target = firstRow ?? emptyState
        target.dispatchEvent(new FocusEvent("focusin", { bubbles: true }))
      }
    }

    let state = readState()
    planSelect.value = state.planId
    tasksInput.value = String(state.tasks)
    setModelControls(selectedPlan(state), state.modelIds)
    renderRows(state, true)

    planSelect.addEventListener("change", () => {
      const plan = planById.get(planSelect.value)

      if (plan === undefined) {
        return
      }

      const modelId = defaultForPlan(plan)
      state = {
        planId: plan.planId,
        modelIds: modelId === null ? [] : [modelId],
        tasks: state.tasks,
      }
      setModelControls(plan, state.modelIds)
      tasksInput.value = String(state.tasks)
      writeUrl(state)
      renderRows(state, true)
    })

    modelOptions.addEventListener("change", (event) => {
      if (!(event.target instanceof HTMLInputElement) || event.target.type !== "checkbox") {
        return
      }

      const selected = [
        ...modelOptions.querySelectorAll<HTMLInputElement>("input[type=checkbox]:checked"),
      ].map((input) => input.value)

      const plan = selectedPlan(state)
      state = { ...state, modelIds: canonicalModelIds(plan, selected) }
      writeUrl(state)
      renderRows(state, true)
    })

    tasksInput.addEventListener("input", () => {
      const value = tasksInput.valueAsNumber
      state = {
        ...state,
        tasks: Number.isFinite(value) && value >= 0 ? value : payload.defaultTasks,
      }

      if (!Number.isFinite(value) || value < 0) {
        tasksInput.value = String(state.tasks)
      }

      writeUrl(state)
      renderRows(state, true)
    })

    resetButton.addEventListener("click", () => {
      const plan = planById.get(payload.defaultPlanId)

      if (plan === undefined) {
        throw new Error("Homepage console cannot reset without its default plan")
      }

      const modelId = defaultForPlan(plan)
      state = {
        planId: plan.planId,
        modelIds: modelId === null ? [] : [modelId],
        tasks: payload.defaultTasks,
      }
      planSelect.value = state.planId
      tasksInput.value = String(state.tasks)
      setModelControls(plan, state.modelIds)
      writeUrl(state)
      renderRows(state, true)
    })
  }
}
