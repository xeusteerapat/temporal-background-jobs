import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from './activities';
import { connectToDatabase } from '../db/mongodb';

async function run() {
	// Connect to database
	await connectToDatabase();

	const connection = await NativeConnection.connect({
		address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
	});

	// Create and run the worker
	const worker = await Worker.create({
		workflowsPath: require.resolve('./workflows'),
		activities,
		taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'application-processing',
		connection,
	});

	console.log(
		'Worker listening to task queue:',
		process.env.TEMPORAL_TASK_QUEUE || 'application-processing'
	);

	await worker.run();
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
