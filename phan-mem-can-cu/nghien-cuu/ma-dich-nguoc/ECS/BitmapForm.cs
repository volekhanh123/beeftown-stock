using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Windows.Forms;
using ECS.Properties;

namespace ECS;

public class BitmapForm : Form
{
	private delegate void DataSet_RefreshCallback(string Type);

	private IContainer components;

	private ECSDataSet eCSDataSet;

	private BindingSource bitmapBindingSource;

	private BindingNavigator bitmapBindingNavigator;

	private ToolStripButton bindingNavigatorAddNewItem;

	private ToolStripLabel bindingNavigatorCountItem;

	private ToolStripButton bindingNavigatorDeleteItem;

	private ToolStripButton bindingNavigatorMoveFirstItem;

	private ToolStripButton bindingNavigatorMovePreviousItem;

	private ToolStripSeparator bindingNavigatorSeparator;

	private ToolStripTextBox bindingNavigatorPositionItem;

	private ToolStripSeparator bindingNavigatorSeparator1;

	private ToolStripButton bindingNavigatorMoveNextItem;

	private ToolStripButton bindingNavigatorMoveLastItem;

	private ToolStripSeparator bindingNavigatorSeparator2;

	private SplitContainer splitContainer;

	private DataGridView bitmapDataGridView;

	private NumericUpDown iD_NumericUpDown;

	private ToolStripSeparator toolStripSeparator1;

	private ToolStripButton P0_TMSFile_toolStripButton;

	private ToolStripButton P0_Ethernet_toolStripButton;

	private Label bitmapIDLabel;

	private Label nameLabel;

	private TextBox nameTextBox;

	private Label usedBlocksLabel;

	private NumericUpDown usedBlocks_NumericUpDown;

	private PictureBox Picture_PictureBox;

	private Label picSize_Label;

	private ToolStripButton AlignUp_ToolStripButton;

	private ToolStripButton editToolStripButton;

	private ToolStripSeparator toolStripSeparator2;

	private ToolStripButton ArrowUp_ToolStripButton;

	private ToolStripButton ArrowDown_ToolStripButton;

	private DataGridViewTextBoxColumn iDDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn occupiedDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn nameDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn usedDataGridViewTextBoxColumn;

	private bool DataSet_Changed;

	private List<SinglePicture> MyLSP;

	protected override void Dispose(bool disposing)
	{
		if (disposing && components != null)
		{
			components.Dispose();
		}
		base.Dispose(disposing);
	}

	private void InitializeComponent()
	{
		this.components = new System.ComponentModel.Container();
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.BitmapForm));
		this.splitContainer = new System.Windows.Forms.SplitContainer();
		this.bitmapDataGridView = new System.Windows.Forms.DataGridView();
		this.iDDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.occupiedDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.nameDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.usedDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.bitmapBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.eCSDataSet = new ECS.ECSDataSet();
		this.picSize_Label = new System.Windows.Forms.Label();
		this.Picture_PictureBox = new System.Windows.Forms.PictureBox();
		this.nameLabel = new System.Windows.Forms.Label();
		this.nameTextBox = new System.Windows.Forms.TextBox();
		this.usedBlocksLabel = new System.Windows.Forms.Label();
		this.usedBlocks_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.bitmapIDLabel = new System.Windows.Forms.Label();
		this.iD_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.bitmapBindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
		this.bindingNavigatorCountItem = new System.Windows.Forms.ToolStripLabel();
		this.bindingNavigatorMoveFirstItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMovePreviousItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorPositionItem = new System.Windows.Forms.ToolStripTextBox();
		this.bindingNavigatorSeparator1 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorMoveNextItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveLastItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator2 = new System.Windows.Forms.ToolStripSeparator();
		this.AlignUp_ToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.ArrowUp_ToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.ArrowDown_ToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.toolStripSeparator2 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorAddNewItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorDeleteItem = new System.Windows.Forms.ToolStripButton();
		this.editToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.toolStripSeparator1 = new System.Windows.Forms.ToolStripSeparator();
		this.P0_TMSFile_toolStripButton = new System.Windows.Forms.ToolStripButton();
		this.P0_Ethernet_toolStripButton = new System.Windows.Forms.ToolStripButton();
		this.splitContainer.Panel1.SuspendLayout();
		this.splitContainer.Panel2.SuspendLayout();
		this.splitContainer.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.bitmapDataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.bitmapBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.Picture_PictureBox).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.usedBlocks_NumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.iD_NumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.bitmapBindingNavigator).BeginInit();
		this.bitmapBindingNavigator.SuspendLayout();
		base.SuspendLayout();
		this.splitContainer.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.splitContainer, "splitContainer");
		this.splitContainer.Name = "splitContainer";
		resources.ApplyResources(this.splitContainer.Panel1, "splitContainer.Panel1");
		this.splitContainer.Panel1.Controls.Add(this.bitmapDataGridView);
		resources.ApplyResources(this.splitContainer.Panel2, "splitContainer.Panel2");
		this.splitContainer.Panel2.Controls.Add(this.picSize_Label);
		this.splitContainer.Panel2.Controls.Add(this.Picture_PictureBox);
		this.splitContainer.Panel2.Controls.Add(this.nameLabel);
		this.splitContainer.Panel2.Controls.Add(this.nameTextBox);
		this.splitContainer.Panel2.Controls.Add(this.usedBlocksLabel);
		this.splitContainer.Panel2.Controls.Add(this.usedBlocks_NumericUpDown);
		this.splitContainer.Panel2.Controls.Add(this.bitmapIDLabel);
		this.splitContainer.Panel2.Controls.Add(this.iD_NumericUpDown);
		this.bitmapDataGridView.AllowUserToAddRows = false;
		this.bitmapDataGridView.AutoGenerateColumns = false;
		this.bitmapDataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.bitmapDataGridView.BorderStyle = System.Windows.Forms.BorderStyle.None;
		this.bitmapDataGridView.Columns.AddRange(this.iDDataGridViewTextBoxColumn, this.occupiedDataGridViewTextBoxColumn, this.nameDataGridViewTextBoxColumn, this.usedDataGridViewTextBoxColumn);
		this.bitmapDataGridView.DataSource = this.bitmapBindingSource;
		resources.ApplyResources(this.bitmapDataGridView, "bitmapDataGridView");
		this.bitmapDataGridView.Name = "bitmapDataGridView";
		this.bitmapDataGridView.ReadOnly = true;
		this.bitmapDataGridView.RowTemplate.Height = 23;
		this.bitmapDataGridView.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
		this.bitmapDataGridView.DataError += new System.Windows.Forms.DataGridViewDataErrorEventHandler(bitmapDataGridView_DataError);
		this.bitmapDataGridView.KeyDown += new System.Windows.Forms.KeyEventHandler(bitmapDataGridView_KeyDown);
		this.iDDataGridViewTextBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.iDDataGridViewTextBoxColumn.DataPropertyName = "ID";
		this.iDDataGridViewTextBoxColumn.FillWeight = 40f;
		resources.ApplyResources(this.iDDataGridViewTextBoxColumn, "iDDataGridViewTextBoxColumn");
		this.iDDataGridViewTextBoxColumn.Name = "iDDataGridViewTextBoxColumn";
		this.iDDataGridViewTextBoxColumn.ReadOnly = true;
		this.iDDataGridViewTextBoxColumn.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.NotSortable;
		this.occupiedDataGridViewTextBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.occupiedDataGridViewTextBoxColumn.DataPropertyName = "Occupied";
		this.occupiedDataGridViewTextBoxColumn.FillWeight = 80f;
		resources.ApplyResources(this.occupiedDataGridViewTextBoxColumn, "occupiedDataGridViewTextBoxColumn");
		this.occupiedDataGridViewTextBoxColumn.Name = "occupiedDataGridViewTextBoxColumn";
		this.occupiedDataGridViewTextBoxColumn.ReadOnly = true;
		this.occupiedDataGridViewTextBoxColumn.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.NotSortable;
		this.nameDataGridViewTextBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.nameDataGridViewTextBoxColumn.DataPropertyName = "Name";
		resources.ApplyResources(this.nameDataGridViewTextBoxColumn, "nameDataGridViewTextBoxColumn");
		this.nameDataGridViewTextBoxColumn.Name = "nameDataGridViewTextBoxColumn";
		this.nameDataGridViewTextBoxColumn.ReadOnly = true;
		this.nameDataGridViewTextBoxColumn.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.NotSortable;
		this.usedDataGridViewTextBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.usedDataGridViewTextBoxColumn.DataPropertyName = "Used";
		this.usedDataGridViewTextBoxColumn.FillWeight = 60f;
		resources.ApplyResources(this.usedDataGridViewTextBoxColumn, "usedDataGridViewTextBoxColumn");
		this.usedDataGridViewTextBoxColumn.Name = "usedDataGridViewTextBoxColumn";
		this.usedDataGridViewTextBoxColumn.ReadOnly = true;
		this.usedDataGridViewTextBoxColumn.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.NotSortable;
		this.bitmapBindingSource.DataMember = "Bitmap";
		this.bitmapBindingSource.DataSource = this.eCSDataSet;
		this.bitmapBindingSource.Sort = "ID";
		this.bitmapBindingSource.BindingComplete += new System.Windows.Forms.BindingCompleteEventHandler(bitmapBindingSource_BindingComplete);
		this.eCSDataSet.DataSetName = "ECSDataSet";
		this.eCSDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		resources.ApplyResources(this.picSize_Label, "picSize_Label");
		this.picSize_Label.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.bitmapBindingSource, "PicSize", true));
		this.picSize_Label.Name = "picSize_Label";
		this.Picture_PictureBox.DataBindings.Add(new System.Windows.Forms.Binding("Image", this.bitmapBindingSource, "Picture", true));
		resources.ApplyResources(this.Picture_PictureBox, "Picture_PictureBox");
		this.Picture_PictureBox.Name = "Picture_PictureBox";
		this.Picture_PictureBox.TabStop = false;
		resources.ApplyResources(this.nameLabel, "nameLabel");
		this.nameLabel.Name = "nameLabel";
		this.nameTextBox.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.bitmapBindingSource, "Name", true));
		resources.ApplyResources(this.nameTextBox, "nameTextBox");
		this.nameTextBox.Name = "nameTextBox";
		resources.ApplyResources(this.usedBlocksLabel, "usedBlocksLabel");
		this.usedBlocksLabel.Name = "usedBlocksLabel";
		this.usedBlocks_NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.bitmapBindingSource, "Used", true));
		resources.ApplyResources(this.usedBlocks_NumericUpDown, "usedBlocks_NumericUpDown");
		this.usedBlocks_NumericUpDown.Maximum = ECS.Properties.Settings.Default.maxClassID;
		this.usedBlocks_NumericUpDown.Name = "usedBlocks_NumericUpDown";
		this.usedBlocks_NumericUpDown.ReadOnly = true;
		resources.ApplyResources(this.bitmapIDLabel, "bitmapIDLabel");
		this.bitmapIDLabel.Name = "bitmapIDLabel";
		this.iD_NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.bitmapBindingSource, "ID", true));
		resources.ApplyResources(this.iD_NumericUpDown, "iD_NumericUpDown");
		this.iD_NumericUpDown.Maximum = ECS.Properties.Settings.Default.maxClassID;
		this.iD_NumericUpDown.Name = "iD_NumericUpDown";
		this.iD_NumericUpDown.ReadOnly = true;
		this.bitmapBindingNavigator.AddNewItem = null;
		this.bitmapBindingNavigator.BindingSource = this.bitmapBindingSource;
		this.bitmapBindingNavigator.CountItem = this.bindingNavigatorCountItem;
		this.bitmapBindingNavigator.DeleteItem = null;
		this.bitmapBindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[19]
		{
			this.bindingNavigatorMoveFirstItem, this.bindingNavigatorMovePreviousItem, this.bindingNavigatorSeparator, this.bindingNavigatorPositionItem, this.bindingNavigatorCountItem, this.bindingNavigatorSeparator1, this.bindingNavigatorMoveNextItem, this.bindingNavigatorMoveLastItem, this.bindingNavigatorSeparator2, this.AlignUp_ToolStripButton,
			this.ArrowUp_ToolStripButton, this.ArrowDown_ToolStripButton, this.toolStripSeparator2, this.bindingNavigatorAddNewItem, this.bindingNavigatorDeleteItem, this.editToolStripButton, this.toolStripSeparator1, this.P0_TMSFile_toolStripButton, this.P0_Ethernet_toolStripButton
		});
		resources.ApplyResources(this.bitmapBindingNavigator, "bitmapBindingNavigator");
		this.bitmapBindingNavigator.MoveFirstItem = this.bindingNavigatorMoveFirstItem;
		this.bitmapBindingNavigator.MoveLastItem = this.bindingNavigatorMoveLastItem;
		this.bitmapBindingNavigator.MoveNextItem = this.bindingNavigatorMoveNextItem;
		this.bitmapBindingNavigator.MovePreviousItem = this.bindingNavigatorMovePreviousItem;
		this.bitmapBindingNavigator.Name = "bitmapBindingNavigator";
		this.bitmapBindingNavigator.PositionItem = this.bindingNavigatorPositionItem;
		this.bindingNavigatorCountItem.Name = "bindingNavigatorCountItem";
		resources.ApplyResources(this.bindingNavigatorCountItem, "bindingNavigatorCountItem");
		this.bindingNavigatorMoveFirstItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMoveFirstItem.Image = ECS.Properties.Resources.bindingNavigatorMoveFirstItem;
		this.bindingNavigatorMoveFirstItem.Name = "bindingNavigatorMoveFirstItem";
		resources.ApplyResources(this.bindingNavigatorMoveFirstItem, "bindingNavigatorMoveFirstItem");
		this.bindingNavigatorMovePreviousItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMovePreviousItem.Image = ECS.Properties.Resources.bindingNavigatorMovePreviousItem;
		this.bindingNavigatorMovePreviousItem.Name = "bindingNavigatorMovePreviousItem";
		resources.ApplyResources(this.bindingNavigatorMovePreviousItem, "bindingNavigatorMovePreviousItem");
		this.bindingNavigatorSeparator.Name = "bindingNavigatorSeparator";
		resources.ApplyResources(this.bindingNavigatorSeparator, "bindingNavigatorSeparator");
		resources.ApplyResources(this.bindingNavigatorPositionItem, "bindingNavigatorPositionItem");
		this.bindingNavigatorPositionItem.Name = "bindingNavigatorPositionItem";
		this.bindingNavigatorSeparator1.Name = "bindingNavigatorSeparator1";
		resources.ApplyResources(this.bindingNavigatorSeparator1, "bindingNavigatorSeparator1");
		this.bindingNavigatorMoveNextItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMoveNextItem.Image = ECS.Properties.Resources.bindingNavigatorMoveNextItem;
		this.bindingNavigatorMoveNextItem.Name = "bindingNavigatorMoveNextItem";
		resources.ApplyResources(this.bindingNavigatorMoveNextItem, "bindingNavigatorMoveNextItem");
		this.bindingNavigatorMoveLastItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMoveLastItem.Image = ECS.Properties.Resources.bindingNavigatorMoveLastItem;
		this.bindingNavigatorMoveLastItem.Name = "bindingNavigatorMoveLastItem";
		resources.ApplyResources(this.bindingNavigatorMoveLastItem, "bindingNavigatorMoveLastItem");
		this.bindingNavigatorSeparator2.Name = "bindingNavigatorSeparator2";
		resources.ApplyResources(this.bindingNavigatorSeparator2, "bindingNavigatorSeparator2");
		this.AlignUp_ToolStripButton.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.AlignUp_ToolStripButton.Image = ECS.Properties.Resources.AlignUp;
		resources.ApplyResources(this.AlignUp_ToolStripButton, "AlignUp_ToolStripButton");
		this.AlignUp_ToolStripButton.Name = "AlignUp_ToolStripButton";
		this.AlignUp_ToolStripButton.Click += new System.EventHandler(AlignUp_ToolStripButton_Click);
		this.ArrowUp_ToolStripButton.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.ArrowUp_ToolStripButton.Image = ECS.Properties.Resources.ArrowUp;
		resources.ApplyResources(this.ArrowUp_ToolStripButton, "ArrowUp_ToolStripButton");
		this.ArrowUp_ToolStripButton.Name = "ArrowUp_ToolStripButton";
		this.ArrowUp_ToolStripButton.Click += new System.EventHandler(ArrowUp_ToolStripButton_Click);
		this.ArrowDown_ToolStripButton.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.ArrowDown_ToolStripButton.Image = ECS.Properties.Resources.ArrowDown;
		resources.ApplyResources(this.ArrowDown_ToolStripButton, "ArrowDown_ToolStripButton");
		this.ArrowDown_ToolStripButton.Name = "ArrowDown_ToolStripButton";
		this.ArrowDown_ToolStripButton.Click += new System.EventHandler(ArrowDown_ToolStripButton_Click);
		this.toolStripSeparator2.Name = "toolStripSeparator2";
		resources.ApplyResources(this.toolStripSeparator2, "toolStripSeparator2");
		this.bindingNavigatorAddNewItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorAddNewItem.Image = ECS.Properties.Resources.bindingNavigatorAddNewItem;
		this.bindingNavigatorAddNewItem.Name = "bindingNavigatorAddNewItem";
		resources.ApplyResources(this.bindingNavigatorAddNewItem, "bindingNavigatorAddNewItem");
		this.bindingNavigatorAddNewItem.Click += new System.EventHandler(bindingNavigatorAddNewItem_Click);
		this.bindingNavigatorDeleteItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorDeleteItem.Image = ECS.Properties.Resources.bindingNavigatorDeleteItem;
		this.bindingNavigatorDeleteItem.Name = "bindingNavigatorDeleteItem";
		resources.ApplyResources(this.bindingNavigatorDeleteItem, "bindingNavigatorDeleteItem");
		this.bindingNavigatorDeleteItem.Click += new System.EventHandler(bindingNavigatorDeleteItem_Click);
		this.editToolStripButton.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.editToolStripButton.Image = ECS.Properties.Resources.Edit;
		resources.ApplyResources(this.editToolStripButton, "editToolStripButton");
		this.editToolStripButton.Name = "editToolStripButton";
		this.editToolStripButton.Click += new System.EventHandler(editToolStripButton_Click);
		this.toolStripSeparator1.Name = "toolStripSeparator1";
		resources.ApplyResources(this.toolStripSeparator1, "toolStripSeparator1");
		resources.ApplyResources(this.P0_TMSFile_toolStripButton, "P0_TMSFile_toolStripButton");
		this.P0_TMSFile_toolStripButton.Name = "P0_TMSFile_toolStripButton";
		this.P0_TMSFile_toolStripButton.Click += new System.EventHandler(P0_TMSFile_toolStripButton_Click);
		resources.ApplyResources(this.P0_Ethernet_toolStripButton, "P0_Ethernet_toolStripButton");
		this.P0_Ethernet_toolStripButton.Name = "P0_Ethernet_toolStripButton";
		this.P0_Ethernet_toolStripButton.Click += new System.EventHandler(P0_Ethernet_toolStripButton_Click);
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.Controls.Add(this.splitContainer);
		base.Controls.Add(this.bitmapBindingNavigator);
		base.Name = "BitmapForm";
		base.FormClosing += new System.Windows.Forms.FormClosingEventHandler(ClassForm_FormClosing);
		base.Load += new System.EventHandler(BitmapForm_Load);
		base.Leave += new System.EventHandler(ClassForm_Leave);
		this.splitContainer.Panel1.ResumeLayout(false);
		this.splitContainer.Panel2.ResumeLayout(false);
		this.splitContainer.Panel2.PerformLayout();
		this.splitContainer.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.bitmapDataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.bitmapBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.Picture_PictureBox).EndInit();
		((System.ComponentModel.ISupportInitialize)this.usedBlocks_NumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.iD_NumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.bitmapBindingNavigator).EndInit();
		this.bitmapBindingNavigator.ResumeLayout(false);
		this.bitmapBindingNavigator.PerformLayout();
		base.ResumeLayout(false);
		base.PerformLayout();
	}

	public BitmapForm()
	{
		InitializeComponent();
	}

	public void DataSet_Refresh(string Type)
	{
		if (base.InvokeRequired)
		{
			Invoke(new DataSet_RefreshCallback(DataSet_Refresh), Type);
		}
		else
		{
			_ = Type == "Bitmap";
		}
	}

	private void DataSet_Update(string Type)
	{
		Program.mf.DataSet_Update(Type, "BitmapForm");
	}

	private void BitmapForm_Load(object sender, EventArgs e)
	{
		Text = Program.GetLang("pw_Bitmap");
		bindingNavigatorAddNewItem.Text = Program.GetLang("pw_AddNew");
		bindingNavigatorDeleteItem.Text = Program.GetLang("pw_Delete");
		bindingNavigatorMoveFirstItem.Text = Program.GetLang("pw_FirstRecord");
		bindingNavigatorMoveLastItem.Text = Program.GetLang("pw_LastRecord");
		bindingNavigatorMoveNextItem.Text = Program.GetLang("pw_NextRecord");
		bindingNavigatorMovePreviousItem.Text = Program.GetLang("pw_PreviousRecord");
		bitmapIDLabel.Text = Program.GetLang("pw_Number") + ":";
		iDDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_Number");
		nameLabel.Text = Program.GetLang("pw_Name") + ":";
		nameDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_Name");
		usedBlocksLabel.Text = Program.GetLang("pw_UsedBlocks") + ":";
		usedDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_UsedBlocks");
		P0_Ethernet_toolStripButton.Text = Program.GetLang("pw_Ethernet");
		P0_TMSFile_toolStripButton.Text = Program.GetLang("pw_TMSFile");
		AlignUp_ToolStripButton.Text = Program.GetLang("pw_AlignUp");
		usedDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_BlockQuantity");
		usedBlocksLabel.Text = Program.GetLang("pw_BlockQuantity") + ":";
		editToolStripButton.Text = Program.GetLang("pw_Edit");
		occupiedDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_OccupiedBlocks");
		ArrowUp_ToolStripButton.Text = Program.GetLang("pw_MoveUp");
		ArrowDown_ToolStripButton.Text = Program.GetLang("pw_MoveUp");
		Font = Settings.Default.CustomFont;
		BitmapFuc.DataSet_Bitmap_Load(ref MyLSP, ref eCSDataSet);
		eCSDataSet.Bitmap.BitmapRowChanged += Bitmap_BitmapRowChanged;
	}

	private void Bitmap_BitmapRowChanged(object sender, ECSDataSet.BitmapRowChangeEvent e)
	{
		if (e.Action == DataRowAction.Rollback || e.Action == DataRowAction.Commit)
		{
			return;
		}
		if (e.Action == DataRowAction.Change)
		{
			GetCurrentRow();
			foreach (SinglePicture item in MyLSP)
			{
				if (item.ID == e.Row.ID)
				{
					item.Name = nameTextBox.Text;
					break;
				}
			}
		}
		DataSet_Changed = true;
	}

	public void SaveData()
	{
		Validate();
		try
		{
			bitmapDataGridView.EndEdit();
			bitmapBindingSource.EndEdit();
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			bitmapBindingSource.CancelEdit();
		}
		if (DataSet_Changed)
		{
			try
			{
				BitmapFuc.DataSet_Bitmap_Save(ref MyLSP);
				DataSet_Update("Bitmap");
				DataSet_Changed = false;
			}
			catch (Exception ex2)
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex2.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			}
		}
	}

	private void bitmapDataGridView_DataError(object sender, DataGridViewDataErrorEventArgs e)
	{
		e.Cancel = true;
	}

	private void P0_TMSFile_toolStripButton_Click(object sender, EventArgs e)
	{
		Program.mf.ShowDialog_TMSfile_Hold(Wizard: false, Spec: false, String: false, Barcode: false, Label: false, PLU: false, Face: false, Dept: false, Class: false, Unit: false, Salesman: false, SP1: false, SP2: false, SP3: false, SP4: false, VIP: false, Bitmap: true);
	}

	private void P0_Ethernet_toolStripButton_Click(object sender, EventArgs e)
	{
		Program.mf.PopMdiChild_Ethernet_Hold(Wizard: false, Spec: false, String: false, Barcode: false, Label: false, PLU: false, Face: false, Dept: false, Class: false, Unit: false, Salesman: false, SP1: false, SP2: false, SP3: false, SP4: false, VIP: false, Bitmap: true);
		if (Program.mf.m_netForm.mf_Docked)
		{
			base.WindowState = FormWindowState.Normal;
			Close();
		}
	}

	private void ClassForm_Leave(object sender, EventArgs e)
	{
		bitmapDataGridView.EndEdit();
		bitmapBindingSource.EndEdit();
		if (DataSet_Changed)
		{
			DataSet_Update("Bitmap");
			DataSet_Changed = false;
		}
	}

	private void ClassForm_FormClosing(object sender, FormClosingEventArgs e)
	{
		eCSDataSet.Bitmap.BitmapRowChanged -= Bitmap_BitmapRowChanged;
		Select(directed: true, forward: true);
		SaveData();
	}

	private void DeleteSelect()
	{
		foreach (DataGridViewRow selectedRow in bitmapDataGridView.SelectedRows)
		{
			if (selectedRow.DataBoundItem is DataRowView dataRowView)
			{
				BitmapFuc.DataSet_Bitmap_Remove(ref MyLSP, (int)dataRowView.Row["ID"]);
				dataRowView.Row.Delete();
			}
		}
		DataSet_Changed = true;
	}

	private void bindingNavigatorDeleteItem_Click(object sender, EventArgs e)
	{
		DeleteSelect();
	}

	private void bitmapDataGridView_KeyDown(object sender, KeyEventArgs e)
	{
		if (e.KeyCode == Keys.Delete)
		{
			e.Handled = true;
			DeleteSelect();
		}
	}

	private void bindingNavigatorAddNewItem_Click(object sender, EventArgs e)
	{
		OpenFileDialog openFileDialog = new OpenFileDialog();
		openFileDialog.CheckFileExists = true;
		openFileDialog.Filter = Program.GetLang("pw_JPEGFile___jpg____jpg_AllFile_________");
		if (openFileDialog.ShowDialog(this) != DialogResult.OK)
		{
			return;
		}
		using WizardPicForm wizardPicForm = new WizardPicForm(openFileDialog.FileName, 432, 432);
		if (wizardPicForm.ShowDialog(this) == DialogResult.OK)
		{
			BitmapFuc.DataSet_Bitmap_Add(ref MyLSP, ref eCSDataSet, wizardPicForm.SG_Name, wizardPicForm.SG_Image, wizardPicForm.SG_String);
			bitmapBindingSource.Position = bitmapBindingSource.Count - 1;
		}
	}

	private ECSDataSet.BitmapRow GetCurrentRow()
	{
		if (bitmapBindingSource.Position == -1)
		{
			return null;
		}
		DataRowView dataRowView = (DataRowView)bitmapBindingSource.Current;
		return (ECSDataSet.BitmapRow)dataRowView.Row;
	}

	private void bitmapBindingSource_BindingComplete(object sender, BindingCompleteEventArgs e)
	{
		if (e.BindingCompleteContext == BindingCompleteContext.DataSourceUpdate)
		{
			BindingSource bindingSource = sender as BindingSource;
			try
			{
				bindingSource.EndEdit();
			}
			catch (Exception ex)
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
				bindingSource.CancelEdit();
			}
		}
	}

	private void editToolStripButton_Click(object sender, EventArgs e)
	{
		ECSDataSet.BitmapRow currentRow = GetCurrentRow();
		if (currentRow == null)
		{
			return;
		}
		OpenFileDialog openFileDialog = new OpenFileDialog();
		openFileDialog.CheckFileExists = true;
		openFileDialog.Filter = Program.GetLang("pw_JPEGFile___jpg____jpg_AllFile_________");
		if (openFileDialog.ShowDialog(this) != DialogResult.OK)
		{
			return;
		}
		using WizardPicForm wizardPicForm = new WizardPicForm(openFileDialog.FileName, 432, 432);
		if (wizardPicForm.ShowDialog(this) == DialogResult.OK && !BitmapFuc.DataSet_Bitmap_ChangePic(ref MyLSP, ref eCSDataSet, currentRow.ID, currentRow.Name, wizardPicForm.SG_Image, wizardPicForm.SG_String) && MessageBox.Show(this, Program.GetLang("pw_BlockOccupied____"), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.YesNo, MessageBoxIcon.Question, MessageBoxDefaultButton.Button2) == DialogResult.Yes)
		{
			BitmapFuc.DataSet_Bitmap_Overwrite(ref MyLSP, currentRow.ID, currentRow.Name, wizardPicForm.SG_Image, wizardPicForm.SG_String);
			BitmapFuc.DataSet_Bitmap_Update(ref MyLSP, ref eCSDataSet);
		}
	}

	private void AlignUp_ToolStripButton_Click(object sender, EventArgs e)
	{
		int position = bitmapBindingSource.Position;
		eCSDataSet.Bitmap.BitmapRowChanged -= Bitmap_BitmapRowChanged;
		if (BitmapFuc.DataSet_Bitmap_AlignUp(ref MyLSP, ref eCSDataSet))
		{
			DataSet_Changed = true;
		}
		eCSDataSet.Bitmap.BitmapRowChanged += Bitmap_BitmapRowChanged;
		bitmapBindingSource.Position = position;
	}

	private void ArrowUp_ToolStripButton_Click(object sender, EventArgs e)
	{
		int position = bitmapBindingSource.Position;
		eCSDataSet.Bitmap.BitmapRowChanged -= Bitmap_BitmapRowChanged;
		int num = BitmapFuc.DataSet_Bitmap_ShiftUp(ref MyLSP, ref eCSDataSet, GetCurrentRow().ID);
		if (num > 0)
		{
			DataSet_Changed = true;
		}
		eCSDataSet.Bitmap.BitmapRowChanged += Bitmap_BitmapRowChanged;
		switch (num)
		{
		case 1:
			bitmapBindingSource.Position = position;
			break;
		case 2:
			bitmapBindingSource.Position = position - 1;
			break;
		}
	}

	private void ArrowDown_ToolStripButton_Click(object sender, EventArgs e)
	{
		int position = bitmapBindingSource.Position;
		eCSDataSet.Bitmap.BitmapRowChanged -= Bitmap_BitmapRowChanged;
		int num = BitmapFuc.DataSet_Bitmap_ShiftDown(ref MyLSP, ref eCSDataSet, GetCurrentRow().ID);
		if (num > 0)
		{
			DataSet_Changed = true;
		}
		eCSDataSet.Bitmap.BitmapRowChanged += Bitmap_BitmapRowChanged;
		switch (num)
		{
		case 1:
			bitmapBindingSource.Position = position;
			break;
		case 2:
			bitmapBindingSource.Position = position + 1;
			break;
		}
	}
}
