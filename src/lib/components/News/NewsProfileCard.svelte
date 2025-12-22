<div class="container mx-auto w-full gap-5 rounded bg-gray-300 px-5 py-2">
	<div class="flex items-center gap-4">
		<a
			href="/"
			aria-label="profile"
			class="profile-picture"
			style="background-image: url('https://i.pinimg.com/474x/99/4a/57/994a5754a082860bf3c92b208dfd063f.jpg');"
		></a>
		<div class="max-w-9/12">
			<h1 class="font-semibold">Dr. Kucing</h1>
			<p>Editor Berita PBD</p>
			<p class="text-justify text-gray-700">
				Lorem ipsum dolor sit amet consectetur adipisicing elit. Saepe molestiae, molestias,
				repellendus quam aut iure odio itaque possimus earum facilis sint unde consequuntur fuga
				nulla exercitationem blanditiis voluptatum reiciendis quaerat.
			</p>
		</div>
	</div>
</div>

<style lang="postcss">
	@reference "tailwindcss";
	.profile-picture {
		@apply h-16 w-16 rounded-full bg-gray-400;
		@apply border bg-cover bg-center bg-no-repeat;
		@apply transform transition-transform ease-in-out hover:scale-105;
	}
</style>
