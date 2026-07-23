<script lang="ts">
	import type { PageData } from './$types';
	import CustomTable from '$lib/components/CustomTable.svelte';
	import Map from '$lib/components/Map.svelte';
	import { columns, type Alert } from '$lib/components/TableColumns/AlertsColumns';
	import Card from '$lib/components/Card.svelte';
	import { closedStyles, criticalStyles, openStyles } from '$lib/styles/CardStyles';
	import AlertsListener from '$lib/components/WebsocketListeners/AlertsListener.svelte';
	import { createAlertsStore } from '$lib/stores/alerts.svelte';
	import ActionsDrawer from '$lib/components/ActionsDrawer.svelte';

	let { data }: { data: PageData } = $props();

	const alerts = createAlertsStore(data.alerts);

	$effect(() => {
		if (data.alerts) {
			alerts.setAlerts(data.alerts);
		}
	});

	let activeFilter = $state<string | null>(null);
	let searchQuery = $state('');

	let alertsData = $derived.by(() => {
		let filtered = alerts.all;
		const query = searchQuery.trim().toLowerCase();

		if (activeFilter === 'open')
			filtered = filtered.filter((a) => a.status === 'active' || a.status === 'open');
		else if (activeFilter === 'closed')
			filtered = filtered.filter((a) => a.status === 'inactive' || a.status === 'closed');
		else if (activeFilter === 'critical') filtered = filtered.filter((a) => a.severity === 5);

		if (query) {
			filtered = filtered.filter(
				(a) =>
					String(a.status).toLowerCase().includes(query) ||
					String(a.alert_type).toLowerCase().includes(query) ||
					String(a.camera_id).toLowerCase().includes(query)
			);
		}
		return filtered;
	});

	let activeAlertsOnly = $derived(
		alerts.all.filter((a) => a.status === 'active' || a.status === 'open')
	);
	let openAlertsCount = $derived(
		alerts.all.filter((a) => a.status === 'active' || a.status === 'open').length
	);
	let closedAlertsCount = $derived(
		alerts.all.filter((a) => a.status === 'inactive' || a.status === 'closed').length
	);
	let criticalAlertsCount = $derived(
		alerts.all.filter((a) => a.severity === 5 && a.status === 'open').length
	);

	const getSeverityColor = (a: Alert) =>
		['#10b981', '#10b981', '#3b82f6', '#f97316', '#f97316', '#ef4444'][a.severity] || '#10b981';
	const getAlertPopup = (a: Alert) =>
		`<div style="color: #18181b; font-size: 12px;">
        <strong>Camera ID:</strong> ${a.camera_id} <br />
        <strong>Severity: </strong> ${a.severity} <br />
        <strong>Location: </strong> (${a.location?.x}, ${a.location?.y})
        </div>`;

	// drawer state
	let isDrawerOpen = $state(false);
	let selectedAlert = $state<Alert | null>(null);

	function handleRowClick(alert: Alert) {
		selectedAlert = alert;
		isDrawerOpen = true;
	}

	function handleStatusUpdate(alertId: string, nextStatus: string) {
		const target = alerts.all.find((a) => a.alert_id === alertId);
		if (target) {
			target.status = nextStatus;
		}
	}

	let focusedAlertId = $state<string | null>(null);
</script>

<AlertsListener store={alerts} />

<div class="space-y-6 p-8">
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<Card
			label="Open Alerts"
			count={openAlertsCount}
			isActive={activeFilter === 'open'}
			style={openStyles}
			onclick={() => (activeFilter = activeFilter === 'open' ? null : 'open')}
		/>
		<Card
			label="Closed Alerts"
			count={closedAlertsCount}
			isActive={activeFilter === 'closed'}
			style={closedStyles}
			onclick={() => (activeFilter = activeFilter === 'closed' ? null : 'closed')}
		/>
		<Card
			label="Critical Alerts"
			count={criticalAlertsCount}
			isActive={activeFilter === 'critical'}
			style={criticalStyles}
			onclick={() => (activeFilter = activeFilter === 'critical' ? null : 'critical')}
		/>
	</div>

	<div class="w-full">
		<input
			type="text"
			bind:value={searchQuery}
			placeholder="Filter by anything"
			class="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-200 outline-none"
		/>
	</div>

	<div class="flex gap-5">
		{#if alertsData.length > 0}
			<CustomTable data={alertsData} {columns} onrowclick={handleRowClick} />
		{:else}
			<div
				class="border-zinc-850 flex w-1/2 flex-col items-center justify-center rounded-xl border border-dashed bg-zinc-900/10 p-12 text-center"
			>
				<svg
					class="mb-3 h-8 w-8 text-zinc-600"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.5"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
				<h3 class="text-sm font-medium text-zinc-400">No matching alerts</h3>
			</div>
		{/if}

		<div class="h-[610px] w-1/2">
			<Map
				items={$state.snapshot(activeAlertsOnly)}
				getLat={(a) => a.location?.y}
				getLng={(a) => a.location?.x}
				getMarkerColor={getSeverityColor}
				getPopupHtml={getAlertPopup}
				center={[32.0, 34.78]}
				zoom={8}
				activeAlertId={focusedAlertId}
			/>
		</div>
	</div>

	<ActionsDrawer
		bind:open={isDrawerOpen}
		alert={selectedAlert}
		onstatusupdate={handleStatusUpdate}
		investigators={data.investigators}
		onLocate={(alertId) => {
			focusedAlertId = alertId;
			isDrawerOpen = false;
		}}
	/>
</div>
