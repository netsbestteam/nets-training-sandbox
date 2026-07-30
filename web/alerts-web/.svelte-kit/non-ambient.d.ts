
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	type MatcherParam<M> = M extends (param : string) => param is (infer U extends string) ? U : string;

	export interface AppTypes {
		RouteId(): "/" | "/api" | "/api/alerts" | "/api/alerts/[id]" | "/api/alerts/[id]/assign" | "/api/investigators" | "/api/investigators/[alertId]" | "/api/investigators/[alertId]/investigators" | "/login" | "/logout" | "/ws";
		RouteParams(): {
			"/api/alerts/[id]": { id: string };
			"/api/alerts/[id]/assign": { id: string };
			"/api/investigators/[alertId]": { alertId: string };
			"/api/investigators/[alertId]/investigators": { alertId: string }
		};
		LayoutParams(): {
			"/": { id?: string | undefined; alertId?: string | undefined };
			"/api": { id?: string | undefined; alertId?: string | undefined };
			"/api/alerts": { id?: string | undefined };
			"/api/alerts/[id]": { id: string };
			"/api/alerts/[id]/assign": { id: string };
			"/api/investigators": { alertId?: string | undefined };
			"/api/investigators/[alertId]": { alertId: string };
			"/api/investigators/[alertId]/investigators": { alertId: string };
			"/login": Record<string, never>;
			"/logout": Record<string, never>;
			"/ws": Record<string, never>
		};
		Pathname(): "/" | `/api/alerts/${string}/assign` & {} | `/api/investigators/${string}/investigators` & {} | "/login" | "/logout" | "/ws";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/robots.txt" | string & {};
	}
}