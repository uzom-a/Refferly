import { NextResponse } from "next/server";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    suburb?: string;
    neighbourhood?: string;
    county?: string;
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") ?? "").trim();

    if (query.length < 3) {
      return NextResponse.json({ results: [] }, { status: 200 });
    }

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "8");

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "TrustNet/1.0 (trustnet.local)",
        "Accept-Language": "en",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`Nominatim responded with ${response.status}`);
    }

    const data = (await response.json()) as NominatimResult[];

    const results = data.map((item) => {
      const address = item.address ?? {};
      const city = address.city ?? address.town ?? address.village ?? address.county ?? "";
      const area = address.suburb ?? address.neighbourhood ?? city;
      return {
        id: String(item.place_id),
        label: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        city,
        area,
        state: address.state ?? "",
        country: address.country ?? "",
      };
    });

    return NextResponse.json({ results }, { status: 200 });
  } catch (error) {
    console.error("[geocode]", error);
    return NextResponse.json(
      { message: "Unable to search locations right now. Please try again." },
      { status: 500 },
    );
  }
}


