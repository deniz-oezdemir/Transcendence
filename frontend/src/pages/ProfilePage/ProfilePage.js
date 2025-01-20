import { createComponent } from '@component';

export default function ProfilePage({ params, query }) {
  return createComponent('div', {
    content: `
      <h1 class="text-center">Profile Page from: ${params.username}</h1>
			<p>This is an example of a non reactive page only render from the content of the createComoponent</p>
			<hr>
      <div class="card" style="width: 18rem;">
        <img src="https://via.placeholder.com/150" class="card-img-top" alt="Image">
        <div class="card-body">
          <h5 class="card-title">Bootstrap Card Example</h5>
          <p class="card-text">This is a simple Bootstrap card added to the Page Component. You can use Bootstrap components like buttons, cards, forms, etc.</p>
          <a href="#" class="btn btn-primary">Button withou functionality</a>
        </div>
      </div>
    `,
  });
}
